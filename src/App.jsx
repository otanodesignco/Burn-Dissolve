import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { SRGBColorSpace } from "three";

function App() {
  return (
    <Canvas 
      shadows 
      camera={{ position: [0, 0, 5], fov: 30 }}
      gl={{ outputColorSpace: SRGBColorSpace }}
    >
      <color attach="background" args={["#353640"]} />
      <Experience />
      <EffectComposer>
        <Bloom
            luminanceThreshold={1}
            intensity={0.7}
            mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}

export default App;
