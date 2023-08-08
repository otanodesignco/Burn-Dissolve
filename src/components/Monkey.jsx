import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useControls } from "leva"
import { useRef } from "react"
import { Color, ShaderMaterial } from "three"

 // uniforms
 const uniforms =
 {
     uThickness: { value: 0.006 },
     uProgress: { value: 0 },
     uBurnScale: { value: 20 },
     uBurnOffset: { value: 8 },
     uColor: { value: new Color('#592e83') },
     uBorderColor: { value: new Color('#8aea92').multiplyScalar( 20 ) }
 }

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

//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
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
     float mappedNoise = ( noise + 1.0 ) * 0.5;

     // calculate the movement direction
     float motion = ( 1.0 + dot( vModelPosition, normalize( vec3( 0., -1., 0. ) ) ) ) / 2.0;

     // reverse the visible color
     motion = 1.0 - motion;

     // create animated burn
     float animateNoise = mappedNoise * motion;

     // animate noise based on progress
     float noiseTexture = step( uProgress, animateNoise );

     // create noise border
     float noiseBorder = step( uProgress  - uThickness, animateNoise ) - noiseTexture;

     // burn noise as a color
     vec3 noiseColor = diffuseColor * noiseTexture;

     vec3 finalColor = mix( diffuseColor, uBorderColor, noiseBorder );

     // set color and opacity
     gl_FragColor = vec4( finalColor, noiseTexture + noiseBorder );

 }

 `

 const burnMaterial = new ShaderMaterial(
    {
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: uniforms,
        transparent: true
    }
 )

export default function Monkey( props )
{

    // import model
    const { nodes } = useGLTF('./models/Monkey.glb')

    // controls
    const { progress } = useControls(
        {
            progress:
            {
                value: 0,
                min: 0,
                max: 1,
                step: 0.001
            }
        }
    )

    const monkey = useRef()

    useFrame( ( state ) =>
    {

        monkey.current.material.uniforms.uProgress.value = progress

    })


    return  <mesh
                ref={ monkey }
                { ...props }
                geometry={ nodes.Suzanne.geometry }
                material={ burnMaterial }
            />


}