import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { useCampusStore } from '../store/campusStore';
import { CampusBuilding, Complaint } from '../types';

function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#07111f" />
    </mesh>
  );
}

function Roads() {
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <planeGeometry args={[52, 3.2]} />
        <meshStandardMaterial color="#1d2d44" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.021, 0]}>
        <planeGeometry args={[3.2, 52]} />
        <meshStandardMaterial color="#1d2d44" />
      </mesh>
    </>
  );
}

function CameraRig() {
  const { camera } = useThree();
  useFrame(() => {
    camera.lookAt(0, 1.8, 0);
  });
  return null;
}

function BuildingMesh({ building }: { building: CampusBuilding }) {
  const selectedBuildingId = useCampusStore((state) => state.selectedBuildingId);
  const complaints = useCampusStore((state) => state.complaints);
  const setSelectedBuildingId = useCampusStore((state) => state.setSelectedBuildingId);
  const setSelectedComplaintId = useCampusStore((state) => state.setSelectedComplaintId);
  const isSelected = selectedBuildingId === building.id;
  const meshRef = useRef<any>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.03 + building.x) * 0.02;
    }
  });

  return (
    <group position={[building.x, building.size[1] / 2, building.z]}>
      <mesh
        ref={meshRef}
        castShadow
        onClick={(event) => {
          event.stopPropagation();
          setSelectedBuildingId(building.id);
          const complaint = complaints.find((item) => item.buildingId === building.id);
          setSelectedComplaintId(complaint?.id ?? null);
        }}
      >
        <boxGeometry args={building.size} />
        <meshStandardMaterial
          color={isSelected ? '#7dd3fc' : building.color}
          emissive={isSelected ? '#0ea5e9' : '#000000'}
          emissiveIntensity={isSelected ? 0.22 : 0}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>

      <Text position={[0, building.size[1] / 2 + 0.65, 0]} fontSize={0.43} color="#e2e8f0" anchorX="center" anchorY="middle">
        {building.block}
      </Text>
      <Text position={[0, building.size[1] / 2 + 0.15, 0]} fontSize={0.16} color="#94a3b8" anchorX="center" anchorY="middle">
        {building.metadata.availability} · {building.wifiHealth}
      </Text>

      {building.classrooms.map((room, index) => (
        <mesh
          key={room.id}
          position={[-building.size[0] / 2 + 0.7 + index * 0.9, building.size[1] / 2 + 0.18, building.size[2] / 2 - 0.55]}
          onClick={(event) => {
            event.stopPropagation();
            useCampusStore.getState().setSelectedBuildingId(building.id);
            useCampusStore.getState().setSelectedComplaintId(null);
          }}
        >
          <boxGeometry args={[0.32, 0.32, 0.32]} />
          <meshStandardMaterial
            color={room.availability === 'Available' ? '#22c55e' : room.availability === 'Reserved' ? '#f59e0b' : '#ef4444'}
            emissive={room.availability === 'Available' ? '#22c55e' : '#000000'}
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

function ComplaintPin({ complaintId }: { complaintId: string }) {
  const complaint = useCampusStore((state) => state.complaints.find((item) => item.id === complaintId)) as Complaint | undefined;
  const buildings = useCampusStore((state) => state.buildings);
  const setSelectedComplaintId = useCampusStore((state) => state.setSelectedComplaintId);
  const building = complaint ? buildings.find((item) => item.id === complaint.buildingId) : null;
  if (!complaint || !building) return null;

  return (
    <mesh
      position={[building.x + 0.5, building.size[1] + 0.4, building.z + 0.5]}
      onClick={(event) => {
        event.stopPropagation();
        setSelectedComplaintId(complaint.id);
      }}
    >
      <sphereGeometry args={[0.28, 24, 24]} />
      <meshStandardMaterial color={complaint.priority === 'Critical' ? '#ff5a7a' : '#67e8f9'} emissive="#67e8f9" emissiveIntensity={0.5} />
    </mesh>
  );
}

export function CampusScene() {
  const buildings = useCampusStore((state) => state.buildings);
  const complaints = useCampusStore((state) => state.complaints);
  const setSelectedBuildingId = useCampusStore((state) => state.setSelectedBuildingId);
  const setSelectedComplaintId = useCampusStore((state) => state.setSelectedComplaintId);

  const complaintPins = useMemo(() => complaints.map((item) => item.id), [complaints]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Interactive 3D campus</h3>
            <p className="mt-1 text-sm text-slate-300">Rotate, zoom, walk around, and click buildings or classrooms.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1">Available</span>
            <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1">Reserved</span>
            <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1">Occupied</span>
          </div>
        </div>
      </div>

      <div className="h-[620px]">
        <Canvas camera={{ position: [0, 16, 20], fov: 45 }} shadows>
          <ambientLight intensity={0.55} />
          <directionalLight position={[14, 18, 10]} intensity={1.5} castShadow />
          <spotLight position={[-18, 20, 8]} angle={0.5} intensity={1.2} castShadow />
          <fog attach="fog" args={['#07111f', 24, 70]} />
          <Ground />
          <Roads />

          {buildings.map((building) => (
            <BuildingMesh key={building.id} building={building} />
          ))}

          {complaintPins.map((complaintId) => (
            <ComplaintPin key={complaintId} complaintId={complaintId} />
          ))}

          <mesh
            rotation-x={-Math.PI / 2}
            position={[0, 0.03, -14]}
            onClick={() => {
              setSelectedBuildingId('block-c');
              setSelectedComplaintId(null);
            }}
          >
            <ringGeometry args={[1.2, 2, 32]} />
            <meshStandardMaterial color="#9effa8" emissive="#9effa8" emissiveIntensity={0.25} />
          </mesh>
          <Text position={[0, 0.25, -14]} fontSize={0.23} color="#9effa8">
            Library plaza
          </Text>

          <CameraRig />
          <OrbitControls makeDefault enablePan enableZoom enableRotate maxPolarAngle={1.55} minDistance={8} maxDistance={45} />
        </Canvas>
      </div>
    </div>
  );
}
