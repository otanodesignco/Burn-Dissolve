import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { SRGBColorSpace } from "three";
import { OrbitControls } from "@react-three/drei";

function App() {
  return (
    <Canvas 
      shadows 
      camera={{ position: [0, 0, 5], fov: 30 }}
      gl={{ outputColorSpace: SRGBColorSpace }}
    >
      <OrbitControls makeDefault />
      <color attach="background" args={["#353640"]} />
      <Experience />
      <EffectComposer>
        <Bloom
            luminanceThreshold={1}
            intensity={1}
            mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}

export default App;
