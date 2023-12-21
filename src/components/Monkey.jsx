import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useControls } from "leva"
import { useRef } from "react"
import BurnMaterial from "./BurnMaterial.jsx"


 const vertex = /*glsl*/`
 
out vec3 vModelPosition;
out vec3 vViewDirection;
out vec3 vNormal;

void main()
{

     // position in world space, swap for multiple instances that animate collectively based on progress vs at the same time if using position
     //vModelPosition = vec4( modelMatrix * vec4( position, 1.0 ) ).xyz;
     vModelPosition = position;

     vec3 worldNormal = vec4( modelMatrix * vec4( normal, 0.0 ) ).xyz;
     vec3 worldPosition = vec4( modelMatrix * vec4( position, 1.0 ) ).xyz;
     

     vViewDirection = normalize( cameraPosition - worldPosition );
     vNormal = normalize( worldNormal );

     // set position in clip space
     gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}

 `

 const fragment = /*glsl*/`

 uniform float uProgress;
 uniform float uBurnScale;
 uniform float uBurnOffset;
 uniform float uThickness;
 uniform vec3 uColor;
 uniform vec3 uBorderColor;

 in vec3 vModelPosition;
 in vec3 vViewDirection;
 in vec3 vNormal;



// remap
float remap(float value, float min1, float max1, float min2, float max2) 
{

  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);

}

 void main()
 {

     // uv as world space coordinates x & y
     vec2 uv = vModelPosition.xy;

     // create diffuse shading based on camera position & world normals
     float diffuse = dot( vNormal, vViewDirection );

     // create default coloring
     vec3 diffuseColor = uColor * diffuse;

     // noise using model position multipled by a scale to control the burn size
     float noise = snoise( vModelPosition * uBurnScale );

     // offset that turns the dissolve to a directional burn
     noise *= ( uBurnOffset * 0.01 );

     // remap values within 0 - 1
     float mappedNoise = ( noise * 1.0 ) + 1.0;

     // calculate the movement direction
    float direction = uv.y;

    //direction = pow( ( direction + 1.0 ) * .5, 2.0 );

     // create animated burn
     float animateNoise = mappedNoise * direction;

     if( direction - uProgress < 0. ) discard;

     // animate noise based on progress
     float noiseTexture = step( uProgress, animateNoise );

     // create noise border
     float noiseBorder = step( uProgress  - uThickness, animateNoise ) - noiseTexture;

     vec3 finalColor = mix( diffuseColor, uBorderColor, noiseBorder );

     // set color and opacity
     gl_FragColor = vec4( finalColor, noiseTexture + noiseBorder );

 }

 `

export default function Monkey( props )
{

    // import model
    const { nodes } = useGLTF('./models/Monkey.glb')

    // controls
    const { progress, scale, offset, color, burnColor, burnColorEnd, burnWidth } = useControls(
        {
            progress:
            {
                value: 0,
                min: 0,
                max: 1,
                step: 0.001
            },
            scale:
            {
              value: 10,
              min: 5,
              max: 20,
              step: 0.001
            },
            offset:
            {
              value: 3,
              min:1,
              max: 10,
              step: 0.001
            },
            color:
            {
              value: '#592e83'
            },
            burnColor:
            {
              value: '#ff6600'
            },
            burnColorEnd:
            {
              value: '#ff6600'
            },
            burnWidth:
            {
              value: 1,
              min: 1,
              max: 5,
              step: 0.01
            }
        }
    )

    const monkey = useRef()

    useFrame( ( state ) =>
    {


    })


    return  <mesh
                ref={ monkey }
                { ...props }
                geometry={ nodes.Suzanne.geometry }
            >
              <BurnMaterial 
                burnProgress={ progress }
                baseColor={ color }
                burnColor={ burnColor }
                burnColorEnd={ burnColorEnd }
                burnAmt={ scale }
                burnOffset={ offset }
                burnWidth={ burnWidth }
              />
            </mesh>


}