import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import { BackSide, FrontSide, DoubleSide, Color } from "three";



export default function BurnMaterial({
    burnColor = '#ff6600', // burn color
    burnIntensity = 15, // intensity for glow
    baseColor = '#592e83', // base color
    burnWidth = 1, // width of the burn effect
    burnAmt = 15, // amout to displace noise
    burnSize = 10, // thickness of the burn
    burnOffset = 1, // size of the burn itself
    burnProgress = 0, // amount mesh has been animated
    side = 'both', // rendered side
})
{
    let renderedSide = DoubleSide

    switch( side.toLowerCase() )
    {
        case 'front':
            renderedSide = FrontSide
        break;

        case 'back':
            renderedSide = BackSide
        break;

        case 'both':
            renderedSide = DoubleSide
        break;

        default:
            renderedSide = DoubleSide
        break;
    }

    const uniforms =
    {
        uBurnColor : new Color( burnColor ).multiplyScalar( burnIntensity ),
        uBaseColor : new Color ( baseColor ),
        uBurnWidth: burnWidth,
        uBurnAmt : burnAmt,
        uBurnSize : burnSize,
        uBurnOffset : burnOffset,
        uBurnProgress : burnProgress
    }

    const vertexShader = /*glsl*/`

    out vec2 vUv;
    out vec3 vView;
    out vec3 vObjectNormals;
    out vec3 vObjectSpace;

    void main()
    {
        // uv coords
        vUv = uv;

        vObjectSpace = ( modelMatrix * vec4( position, 1.0 ) ).xyz;

        // normals in object space calculation
        vObjectNormals = ( modelMatrix * vec4( normal, 0.0 ) ).xyz;
        vObjectNormals = normalize( vObjectNormals );

        vView = normalize( cameraPosition - vObjectSpace );

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
    `

    const fragmentShader = /*glsl*/`
    uniform vec3 uBurnColor;
    uniform vec3 uBaseColor;
    uniform float uBurnAmt;
    uniform float uBurnWidth;
    uniform float uBurnSize;
    uniform float uBurnOffset;
    uniform float uBurnProgress;

    in vec2 vUv;
    in vec3 vView;
    in vec3 vObjectNormals;
    in vec3 vObjectSpace;

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

    float lambertLighting( vec3 normal, vec3 viewDirection )
    {
        return max( dot( normal, viewDirection ), 0.0 );
    }

    void main()
    {

        vec2 uv = vUv; // uv
        float progress = uBurnProgress; // burn animation progress
        vec3 objectUV = vObjectSpace * 0.45 + .5; // object space corrected uv

        // noise calculation
        vec3 noiseUV = objectUV * uBurnAmt; // noise uv
        float noise = snoise( noiseUV ); // noise pattern
        noise *= ( uBurnOffset * 0.01 );

        // transition calculation
        float direction = objectUV.y; // direction of animation
        float transition = step( progress - noise , direction ); // transition base for clip test 
        if( transition - progress < 0.0 ) discard; // discard fragments if the transition - the animation progress is less than 0

        // burn border
        float burnThicc = uBurnWidth  * 0.01; // reduce line size for actual thickness
        float burn =  1.0 - step( ( progress - noise ) + burnThicc , direction ); // transition for burn

        // calculate diffuse lighting
        vec3 diffuseColor = uBaseColor; // diffuse color
        float diffuse = lambertLighting( vObjectNormals, vView ); // lambert lighting calculation
        diffuseColor *= diffuse;

        vec3 finalColor = mix( diffuseColor, uBurnColor, burn ); // final color for mesh

        gl_FragColor = vec4( finalColor, transition );

    }

    `

    const BurnMaterial = shaderMaterial( uniforms, vertexShader, fragmentShader )
    extend( { BurnMaterial })

    console.log( BurnMaterial )

    return (
    <burnMaterial
        key={ BurnMaterial.key }
        transparent={ true }
        side={ DoubleSide }
    />
    )
}

