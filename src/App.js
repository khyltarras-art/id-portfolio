import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Environment, Lightformer, Text, Image, Float, Svg, Center, Html } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
// 1. ADDED AnimatePresence HERE
import { motion, AnimatePresence } from 'framer-motion'

extend({ MeshLineGeometry, MeshLineMaterial })

// --- ASSETS PRELOAD ---
useGLTF.preload('https://raw.githubusercontent.com/khyltarras-art/id-des/refs/heads/main/Card.glb')
useTexture.preload('https://raw.githubusercontent.com/khyltarras-art/id-des/refs/heads/main/band.png')
useGLTF.preload('https://raw.githubusercontent.com/khyltarras-art/id-des/main/face2.glb')

// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <div style={{ height: '400vh', width: '100%', backgroundColor: '#1e1d1d' }}>
      
      {/* GLOBAL FONTS (Backups) */}
      <style>{`
        @font-face {
          font-family: 'Postertoaster';
          src: url('/Postertoaster.woff') format('woff');
        }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', overflow: 'hidden' }}>
        <Canvas camera={{ position: [0, 0, 15], fov: 25 }} shadows>
          
          <CameraScrollRig />
          <ambientLight intensity={0.1} />
          <spotLight position={[0, 5, 10]} intensity={1} angle={0.3} penumbra={1} />

          {/* --- MOVING GRID BACKGROUND --- */}
          <MovingGrid />

          {/* --- SECTION 1: LANYARD --- */}
          <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
            <Band />
          </Physics>
          <Text position={[0, -1, -6]} fontSize={4.5} color="#fc568d" anchorX="center" anchorY="middle" font="/Postertoaster.woff">
            PORTFOLIO
          </Text>
          <Text position={[0, -3, 0.1]} fontSize={0.5} color="#6366f1" anchorX="center" anchorY="middle" font="/Postertoaster.woff">
            Motion Graphic Designer
          </Text>
          <Text position={[0, -3, -10]} fontSize={0.5} color="#6366f1" anchorX="center" anchorY="middle" font="/Postertoaster.woff">
            Khyl Arsi Tarras
          </Text>

          {/* --- SECTION 2: POLAROIDS --- */}
          <SecondSection />

          {/* --- SECTION 3: SKILLS --- */}
          <ThirdSection />

          {/* --- SECTION 4: AVATAR & LINKS --- */}
          <FourthSection />
          
          <Environment background blur={0.5}>
            <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
          </Environment>
        </Canvas>
      </div>
    </div>
  )
}

// --- NEW COMPONENT: ScrambleText ---
const ScrambleText = ({ text }) => {
    const [displayText, setDisplayText] = useState(text)
    const chars = "abcdefghijklmnopqrstuvwxyz"
    const intervalRef = useRef(null)

    useEffect(() => {
        let iteration = 0
        clearInterval(intervalRef.current)

        intervalRef.current = setInterval(() => {
            setDisplayText(prev => 
                text
                .split("")
                .map((letter, index) => {
                    if (index < iteration) {
                        return text[index]
                    }
                    return chars[Math.floor(Math.random() * chars.length)]
                })
                .join("")
            )

            if (iteration >= text.length) {
                clearInterval(intervalRef.current)
            }
            iteration += 1 / 3
        }, 8)

        return () => clearInterval(intervalRef.current)
    }, [text])

    return (
        <>
            <style>{`
                @font-face {
                    font-family: 'FragmentFont';
                    src: url('/fragment.ttf') format('truetype');
                }
            `}</style>
            <div style={{
                fontFamily: "'FragmentFont', sans-serif",
                color: '#6366f1', 
                fontSize: '0.3rem',
                letterSpacing: '0.2em',
                whiteSpace: 'nowrap',
                textShadow: '0px 0px 5px rgba(0,0,0,0.5)'
            }}>
                {displayText}
            </div>
        </>
    )
}

// --- UPDATED COMPONENT: EmailRig ---
function EmailRig({ position, email }) {
    const [hovered, setHover] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopy = (e) => {
        e.preventDefault() // Prevent navigation if href exists
        navigator.clipboard.writeText(email)
        setCopied(true)
        
        // Hide the "Copied" message after 2 seconds
        setTimeout(() => {
            setCopied(false)
        }, 2000)
    }
    
    return (
        <group position={position}>
            {/* 1. SCRAMBLE TEXT (Hover) */}
            {hovered && !copied && (
                <Html position={[0.4, 0.25, 0]} transform center style={{ pointerEvents: 'none' }}>
                    <ScrambleText text={email} />
                </Html>
            )}

            {/* 2. COPIED ANIMATION (Click) */}
            {/* Using AnimatePresence to allow exit animations */}
            <Html position={[-1, 0.03, 0]} transform center style={{ pointerEvents: 'none', width: '300px', display: 'flex', justifyContent: 'center' }}>
                <AnimatePresence>
                    {copied && (
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.15 }}
                            animate={{ opacity: 1, y: 0, scale: 0.2 }}
                            exit={{ opacity: 0, y: -100, scale: 0.15 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            style={{
                                background: 'rgba(252, 86, 141, 0.85)', // Your pink theme color
                                backdropFilter: 'blur(8px)',
                                padding: '10px 20px',
                                borderRadius: '25px',
                                color: 'white',
                                fontFamily: "'fragment.ttf', sans-serif",
                                fontSize: '1.5rem',
                                boxShadow: '0 4px 15px rgba(252, 86, 141, 0.4)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span> Copied! </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Html>

            {/* 3. THE BUTTON */}
            <FlipLink 
                position={[0, 0, 0]} 
                href="#" // Use # so it's still clickable
                onClick={handleCopy}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                EMAIL ME
            </FlipLink>
        </group>
    )
}

// --- SECTION 4 ---
function FourthSection() {
    const { viewport } = useThree()
    const yOffset = -viewport.height * 3

    const images = [
        "https://scontent.fmnl9-7.fna.fbcdn.net/v/t39.30808-6/514334019_4057430517918811_3656949396103382710_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEQ00nFkcXbUI8ZEg04EtpUcgXKmZhpWa5yBcqZmGlZrvY5nmNxAyje8xDPFCvIQUVEGauBqPPxUTvAdECNE9Ya&_nc_ohc=Z4KOO4CL90UQ7kNvwEls7cQ&_nc_oc=Adn96bkBDa6VN9L5pFvuyKbFoO5YvSPjDD4sMwhOQfthngMPeunu0rOxaYqVyFKKIKQ&_nc_zt=23&_nc_ht=scontent.fmnl9-7.fna&_nc_gid=vsaLtYxCp9oSfdhmqtVxWA&oh=00_Aflv6DYseZtIZZ-xIrOHi6K8yr-6BJYHyu9e6WcAwooZtQ&oe=69575B7E", 
        "https://scontent.fmnl9-7.fna.fbcdn.net/v/t39.30808-6/514334019_4057430517918811_3656949396103382710_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEQ00nFkcXbUI8ZEg04EtpUcgXKmZhpWa5yBcqZmGlZrvY5nmNxAyje8xDPFCvIQUVEGauBqPPxUTvAdECNE9Ya&_nc_ohc=Z4KOO4CL90UQ7kNvwEls7cQ&_nc_oc=Adn96bkBDa6VN9L5pFvuyKbFoO5YvSPjDD4sMwhOQfthngMPeunu0rOxaYqVyFKKIKQ&_nc_zt=23&_nc_ht=scontent.fmnl9-7.fna&_nc_gid=vsaLtYxCp9oSfdhmqtVxWA&oh=00_Aflv6DYseZtIZZ-xIrOHi6K8yr-6BJYHyu9e6WcAwooZtQ&oe=69575B7E", 
        "https://scontent.fmnl9-7.fna.fbcdn.net/v/t39.30808-6/514334019_4057430517918811_3656949396103382710_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEQ00nFkcXbUI8ZEg04EtpUcgXKmZhpWa5yBcqZmGlZrvY5nmNxAyje8xDPFCvIQUVEGauBqPPxUTvAdECNE9Ya&_nc_ohc=Z4KOO4CL90UQ7kNvwEls7cQ&_nc_oc=Adn96bkBDa6VN9L5pFvuyKbFoO5YvSPjDD4sMwhOQfthngMPeunu0rOxaYqVyFKKIKQ&_nc_zt=23&_nc_ht=scontent.fmnl9-7.fna&_nc_gid=vsaLtYxCp9oSfdhmqtVxWA&oh=00_Aflv6DYseZtIZZ-xIrOHi6K8yr-6BJYHyu9e6WcAwooZtQ&oe=69575B7E", 
        "https://scontent.fmnl9-7.fna.fbcdn.net/v/t39.30808-6/514334019_4057430517918811_3656949396103382710_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEQ00nFkcXbUI8ZEg04EtpUcgXKmZhpWa5yBcqZmGlZrvY5nmNxAyje8xDPFCvIQUVEGauBqPPxUTvAdECNE9Ya&_nc_ohc=Z4KOO4CL90UQ7kNvwEls7cQ&_nc_oc=Adn96bkBDa6VN9L5pFvuyKbFoO5YvSPjDD4sMwhOQfthngMPeunu0rOxaYqVyFKKIKQ&_nc_zt=23&_nc_ht=scontent.fmnl9-7.fna&_nc_gid=vsaLtYxCp9oSfdhmqtVxWA&oh=00_Aflv6DYseZtIZZ-xIrOHi6K8yr-6BJYHyu9e6WcAwooZtQ&oe=69575B7E", 
        "https://scontent.fmnl9-7.fna.fbcdn.net/v/t39.30808-6/514334019_4057430517918811_3656949396103382710_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEQ00nFkcXbUI8ZEg04EtpUcgXKmZhpWa5yBcqZmGlZrvY5nmNxAyje8xDPFCvIQUVEGauBqPPxUTvAdECNE9Ya&_nc_ohc=Z4KOO4CL90UQ7kNvwEls7cQ&_nc_oc=Adn96bkBDa6VN9L5pFvuyKbFoO5YvSPjDD4sMwhOQfthngMPeunu0rOxaYqVyFKKIKQ&_nc_zt=23&_nc_ht=scontent.fmnl9-7.fna&_nc_gid=vsaLtYxCp9oSfdhmqtVxWA&oh=00_Aflv6DYseZtIZZ-xIrOHi6K8yr-6BJYHyu9e6WcAwooZtQ&oe=69575B7E", 
        "https://scontent.fmnl9-7.fna.fbcdn.net/v/t39.30808-6/514334019_4057430517918811_3656949396103382710_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEQ00nFkcXbUI8ZEg04EtpUcgXKmZhpWa5yBcqZmGlZrvY5nmNxAyje8xDPFCvIQUVEGauBqPPxUTvAdECNE9Ya&_nc_ohc=Z4KOO4CL90UQ7kNvwEls7cQ&_nc_oc=Adn96bkBDa6VN9L5pFvuyKbFoO5YvSPjDD4sMwhOQfthngMPeunu0rOxaYqVyFKKIKQ&_nc_zt=23&_nc_ht=scontent.fmnl9-7.fna&_nc_gid=vsaLtYxCp9oSfdhmqtVxWA&oh=00_Aflv6DYseZtIZZ-xIrOHi6K8yr-6BJYHyu9e6WcAwooZtQ&oe=69575B7E"  
      ]
  
    return (
      <group position={[0, yOffset, 0]}>
        
        {/* LINKS */}
        <FlipLink position={[0, -1, 0]} href="#">Scroll Up</FlipLink>
        
        <EmailRig position={[-2, 3.5, 0]} email="khyltarras@gmail.com" />
        
        <FlipLink position={[-0.5, 3.5, 0]} href="https://www.linkedin.com/in/khyl-arsi-tarras-04359117b/">LinkedIn</FlipLink>
  
        <FlipLink position={[1, 3.5, 0]} href="https://www.instagram.com/khyl.aep/">INSTAGRAM</FlipLink>
        <FlipLink position={[2.5, 3.5, 0]} href="behance.net/gallery/185938111/Khyl-Tarras-Portfolio">Behance</FlipLink>
        <FlipLink position={[2.35, 3.2, 0]} href="https://khyl.my.canva.site/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Canva</FlipLink>
  
        {/* AVATAR CENTER */}
        <group position={[0, 0.8, -3]}>
            <Avatar url="https://raw.githubusercontent.com/khyltarras-art/id-des/main/face2.glb" /> 
        </group>

        {/* --- POLAROIDS --- */}
        <Float speed={4} rotationIntensity={0.1} floatIntensity={0.2}>
            {/* Left Stack */}
            <DraggableImage position={[-5, 3.2, 0.5]} scale={1.6} url={images[0]} rotation={[0, 0, -0.1]} />
            <DraggableImage position={[-3.5, 1.8, 0.7]} scale={1.8} url={images[1]} rotation={[0, 0, 0.15]} />
            <DraggableImage position={[-4.8, 0.0, 0.6]} scale={1.5} url={images[2]} rotation={[0, 0, -0.05]} />

            {/* Right Stack */}
            <DraggableImage position={[4.5, 3.0, 0.5]} scale={1.6} url={images[3]} rotation={[0, 0, 0.1]} />
            <DraggableImage position={[3.2, 1.6, 0.8]} scale={1.8} url={images[4]} rotation={[0, 0, -0.2]} />
            <DraggableImage position={[5.0, 0.2, 0.6]} scale={1.5} url={images[5]} rotation={[0, 0, 0.05]} />
        </Float>

      </group>
    )
}

// --- UPDATED MOVING GRID COMPONENT ---
function MovingGrid() {
    const materialRef = useRef()
    
    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
        }
    })

    const uniforms = useMemo(
      () => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#fc568d') }, 
      }),
      []
    )

    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
        <planeGeometry args={[200, 200, 1, 1]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          depthWrite={false} 
          uniforms={uniforms}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelMatrix * viewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            uniform float uTime;
            uniform vec3 uColor;

            void main() {
               float gridDensity = 100.0;
               float speed = 0.05;       
               float thickness = 0.025;  

               vec2 animatedUv = vUv + vec2(0.0, uTime * speed);

               vec2 grid = abs(fract(animatedUv * gridDensity - 0.5) - 0.5) / thickness;
               float line = min(grid.x, grid.y);
               float gridPattern = 1.0 - min(line, 1.0);

               float dist = distance(vUv, vec2(0.5));
               float fade = 1.0 - smoothstep(0.2, 0.7, dist);

               vec3 finalColor = uColor * gridPattern;
               gl_FragColor = vec4(finalColor, gridPattern * fade * 0.9);
            }
          `}
        />
      </mesh>
    )
}

// --- CAMERA SCROLL RIG ---
function CameraScrollRig() {
  const { camera, viewport } = useThree()
  const scrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight
      scrollY.current = window.scrollY / totalHeight
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useFrame((state, delta) => {
    const targetY = -scrollY.current * (viewport.height * 3)
    const targetZ = 15 - (scrollY.current * 3) 
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 4)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 4)
  })
  return null
}

// --- UPDATED FLIP LINK COMPONENT ---
const DURATION = 0.25;
const STAGGER = 0.025;

const FlipLink = ({ children, href, onClick, position, fontSize = '4rem', onMouseEnter, onMouseLeave }) => {
  return (
    <Html
      transform
      scale={0.21}
      position={position}
      style={{ pointerEvents: 'none' }}
    >
      <motion.a
        initial="initial"
        whileHover="hovered"
        href={href}
        onClick={onClick}
        onMouseEnter={onMouseEnter} 
        onMouseLeave={onMouseLeave} 
        style={{
          display: 'block',
          position: 'relative',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          color: '#fc568d',
          fontFamily: "'Postertoaster', sans-serif",
          fontWeight: 100,
          fontSize: fontSize,
          lineHeight: 0.85,
          textDecoration: 'none',
          cursor: 'pointer',
          pointerEvents: 'auto'
        }}
      >
        <div style={{ position: 'relative' }}>
          {children.split("").map((l, i) => (
            <motion.span
              variants={{ initial: { y: 0 }, hovered: { y: "-100%" } }}
              transition={{ duration: DURATION, ease: "easeInOut", delay: STAGGER * i }}
              style={{ display: 'inline-block' }}
              key={i}
            >
              {l === " " ? "\u00A0" : l}
            </motion.span>
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0 }}>
          {children.split("").map((l, i) => (
            <motion.span
              variants={{ initial: { y: "100%" }, hovered: { y: 0 } }}
              transition={{ duration: DURATION, ease: "easeInOut", delay: STAGGER * i }}
              style={{ display: 'inline-block' }}
              key={i}
            >
              {l === " " ? "\u00A0" : l}
            </motion.span>
          ))}
        </div>
      </motion.a>
    </Html>
  );
};

// --- DRAGGABLE IMAGE COMPONENT ---
function DraggableImage({ position, scale, url, rotation = [0, 0, 0] }) {
    const groupRef = useRef()
    const [hovered, setHover] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [aspect, setAspect] = useState(1) // Default to square
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
    const offset = useRef(new THREE.Vector3())
    const intersectPoint = useRef(new THREE.Vector3())

    useFrame((state) => {
        if (dragging && groupRef.current) {
            state.raycaster.ray.intersectPlane(plane, intersectPoint.current)
            groupRef.current.position.subVectors(intersectPoint.current, offset.current)
        }
    })

    const imgHeight = scale
    const imgWidth = scale * aspect
    const BORDER_THICKNESS = scale * 0.06;
    const BOTTOM_CHIN = scale * 0.25;
    const frameWidth = imgWidth + (BORDER_THICKNESS * 2);
    const frameHeight = imgHeight + BORDER_THICKNESS + BOTTOM_CHIN;
    const yOffset = (-frameHeight / 2 + BOTTOM_CHIN) + (imgHeight / 2);

    return (
        <group 
            ref={groupRef} 
            position={position} 
            rotation={rotation}
            onPointerDown={(e) => {
                e.stopPropagation()
                e.ray.intersectPlane(plane, intersectPoint.current)
                offset.current.subVectors(intersectPoint.current, groupRef.current.position)
                e.target.setPointerCapture(e.pointerId)
                setDragging(true)
            }}
            onPointerUp={(e) => {
                e.stopPropagation()
                e.target.releasePointerCapture(e.pointerId)
                setDragging(false)
            }}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[frameWidth, frameHeight]} />
                <meshBasicMaterial color="#f4f4f4" side={THREE.DoubleSide} />
            </mesh>
            <Image
                url={url}
                scale={[imgWidth, imgHeight]}
                position={[0, yOffset, 0.01]} 
                transparent
                onLoad={(texture) => {
                    const naturalAspect = texture.image.width / texture.image.height
                    setAspect(naturalAspect)
                }}
            />
        </group>
    )
}

// --- AVATAR COMPONENT ---
function Avatar({ url }) {
    const pivotRef = useRef()
    const targetVec = useRef(new THREE.Vector3(0, 0, 20)) 
    const { viewport, mouse } = useThree()
    const gltf = useGLTF(url)
  
    const EYE_Y_OFFSET = 1.1; 
    const MODEL_SCALE = 5; 
    const LERP_SPEED = 6;
    const LOOK_AMOUNT_X = 15.0; 
    const LOOK_AMOUNT_Y = 15.0;   
    const DEADZONE = 0.1; 
  
    useFrame((state, delta) => {
      if (!pivotRef.current) return
      let desiredX = mouse.x * (viewport.width / 2) * LOOK_AMOUNT_X
      let desiredY = mouse.y * (viewport.height / 2) * LOOK_AMOUNT_Y
      if (Math.abs(mouse.x) < DEADZONE && Math.abs(mouse.y) < DEADZONE) {
          desiredX = 0; desiredY = 0;
      }
      targetVec.current.x = THREE.MathUtils.lerp(targetVec.current.x, desiredX, delta * LERP_SPEED)
      targetVec.current.y = THREE.MathUtils.lerp(targetVec.current.y, desiredY, delta * LERP_SPEED)
      targetVec.current.z = 20 
      pivotRef.current.lookAt(targetVec.current)
    })
  
    useEffect(() => {
        gltf.scene.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true
                node.receiveShadow = true
            }
        })
    }, [gltf])
  
    return (
        <group ref={pivotRef}>
            <primitive object={gltf.scene} position={[0, -EYE_Y_OFFSET, 0]} scale={MODEL_SCALE} />
        </group>
    )
}

// --- SECTION 3: SKILLS ---
function ThirdSection() {
  const { viewport } = useThree()
  const yOffset = -viewport.height * 2
  const PINK = "#fc568d" 

  return (
    <group position={[0, yOffset, 0]}>
      <group position={[-3, 1, 0]}>
        <group position={[0, 1.2, 0]}>
          <Text fontSize={0.5} color="#fc568d" font="/Postertoaster.woff" anchorX="left" position={[-1.5, 1, 0]}>ABOUT ME</Text>
          <Text maxWidth={3.5} fontSize={0.13} color="#cccccc" font="/fragment.ttf" anchorX="left" anchorY="top" position={[-1.5, 0.5, 0]} lineHeight={1.6}>
            I’m Khyl Tarras, an independent designer & industrial engineer shaping brands that stand out and drive meaningful growth.

Originally from General Santos, Philippines and now based in Laguna, Philippines I’m passionate about bringing ambitious visions to life and partnering with founders and brands who refuse to settle for average.

Specialising in branding, user centered design, and Motion Graphics.
          </Text>
        </group>
        <group position={[0, -2, 0]}>
          <Text fontSize={0.5} color="#fc568d" font="/Postertoaster.woff" anchorX="left" position={[-1.5, 1, 0]}>EDUCATION</Text>
          <Text maxWidth={4} fontSize={0.13} color="#cccccc" font="/fragment.ttf" anchorX="left" anchorY="top" position={[-1.5, 0.5, 0]} lineHeight={2}>
            BS Industrial Engineering{'\n'}4 Years Vice President for Creatives{'\n'}Scholar at DataCamp{'\n'}AWS Cloud Club PUP - Motion Designer{'\n'}Head of Social Media University Week'25 PUPBC
          </Text>
        </group>
      </group>

      <group position={[3, 0, 0]}>
        <Text position={[0, 2.5, 0]} fontSize={0.8} color="#6366f1" font="/Postertoaster.woff" anchorX="center">TECHNICAL SKILLS</Text>
        <group position={[-0.5, 0.5, 0]}>
            <SkillIcon groupY={yOffset} position={[-1.2, 1, 0]} color={PINK} scaleAdjustment={5.0} url="https://raw.githubusercontent.com/khyltarras-art/id-portfolio/9de9c9294c09006b69e0646a5af374c993818ab7/svg/ps.svg" />
            <SkillIcon groupY={yOffset} position={[-0.4, 1, 0]} color={PINK} scaleAdjustment={5.0} url="https://raw.githubusercontent.com/khyltarras-art/id-portfolio/2ef132951649eec0e0378043636c1d3137cbde9c/svg/ai.svg" />
            <SkillIcon groupY={yOffset} position={[0.4, 1, 0]}  color={PINK} scaleAdjustment={5.0} url="https://raw.githubusercontent.com/khyltarras-art/id-portfolio/9de9c9294c09006b69e0646a5af374c993818ab7/svg/ae.svg" />
            <SkillIcon groupY={yOffset} position={[1.2, 1, 0]}  color={PINK} scaleAdjustment={5.0} url="https://raw.githubusercontent.com/khyltarras-art/id-portfolio/9de9c9294c09006b69e0646a5af374c993818ab7/svg/pr.svg" />
            <SkillIcon groupY={yOffset} position={[-1.2, 0, 0]} color={PINK} scaleAdjustment={0.85} url="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unrealengine/unrealengine-original.svg" />
            <SkillIcon groupY={yOffset} position={[-0.4, 0, 0]} color={PINK} scaleAdjustment={0.85} url="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/blender/blender-original.svg" />
            <SkillIcon groupY={yOffset} position={[0.4, 0, 0]}  color={PINK} scaleAdjustment={0.6} url="https://raw.githubusercontent.com/khyltarras-art/id-portfolio/refs/heads/main/svg/canva.svg" />
            <SkillIcon groupY={yOffset} position={[1.2, 0, 0]}  color={PINK} scaleAdjustment={0.6} url="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" />
            <SkillIcon groupY={yOffset} position={[-1.2, -1, 0]} color={PINK} scaleAdjustment={4.0} url="https://cdn.simpleicons.org/notion/white" />
            <SkillIcon groupY={yOffset} position={[-0.4, -1, 0]} color={PINK} scaleAdjustment={0.7} url="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg" />
            <SkillIcon groupY={yOffset} position={[0.4, -1, 0]}  color={PINK} scaleAdjustment={4.0} url="https://raw.githubusercontent.com/khyltarras-art/id-portfolio/2ef132951649eec0e0378043636c1d3137cbde9c/svg/n8n.svg" />
            <SkillIcon groupY={yOffset} position={[1.2, -1, 0]}  color={PINK} scaleAdjustment={4.0} url="https://raw.githubusercontent.com/khyltarras-art/id-portfolio/9de9c9294c09006b69e0646a5af374c993818ab7/svg/midjourney.svg" />
        </group>
      </group>
    </group>
  )
}

function SkillIcon({ position, url, color, scaleAdjustment = 1.0, groupY }) {
    const ref = useRef()
    const [hovered, setHover] = useState(false)
    const svgProps = color ? { fillMaterial: { color: color } } : {};
    const initialLocalPos = useMemo(() => new THREE.Vector3(...position), [position])
    const worldPos = useMemo(() => new THREE.Vector3(), [])
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
    const mouse3D = useMemo(() => new THREE.Vector3(), [])

    useFrame((state) => {
        if (!ref.current) return
        state.raycaster.ray.intersectPlane(plane, mouse3D)
        ref.current.parent.localToWorld(worldPos.copy(initialLocalPos))
        const dx = mouse3D.x - worldPos.x
        const dy = mouse3D.y - worldPos.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        let targetX = initialLocalPos.x
        let targetY = initialLocalPos.y
        if (dist < 1.5) {
            const angle = Math.atan2(dy, dx)
            targetX -= Math.cos(angle) * 0.5 * (1 - dist/1.5)
            targetY -= Math.sin(angle) * 0.5 * (1 - dist/1.5)
        }
        ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targetX, 0.1)
        ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.1)
    })
    return (
      <group ref={ref} position={position} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)} scale={hovered ? 1.2 : 1}>
        <Center><Svg src={url} scale={0.004 * scaleAdjustment} {...svgProps} /></Center>
      </group>
    )
}

// --- SECTION 2: POLAROIDS ---
function SecondSection() {
  const { viewport } = useThree()
  const textRef = useRef()
  const yOffset = -viewport.height
  useFrame((state, delta) => {
    if (textRef.current) {
      const targetX = (state.mouse.x * viewport.width) / -20
      const targetY = (state.mouse.y * viewport.height) / -20
      textRef.current.position.x = THREE.MathUtils.lerp(textRef.current.position.x, targetX, delta * 2)
      textRef.current.position.y = THREE.MathUtils.lerp(textRef.current.position.y, targetY, delta * 2)
    }
  })
  const images = [
    "https://raw.githubusercontent.com/khyltarras-art/id-portfolio/refs/heads/main/imgs/1.jpg",
    "https://raw.githubusercontent.com/khyltarras-art/id-portfolio/refs/heads/main/imgs/2.png",
    "https://raw.githubusercontent.com/khyltarras-art/id-portfolio/refs/heads/main/imgs/3.png",
    "https://raw.githubusercontent.com/khyltarras-art/id-portfolio/refs/heads/main/imgs/4.jpg",
    "https://raw.githubusercontent.com/khyltarras-art/id-portfolio/refs/heads/main/imgs/6.jpg"
  ]
  return (
    <group position={[0, yOffset, 0]}>
      <group position={[0, 0, -5]} ref={textRef}>
        <Text fontSize={4.5} color="white" font="/Postertoaster.woff" anchorX="center" anchorY="middle">KHYL</Text>
      </group>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        <DraggableImage position={[-3, 0, 0]} scale={1.7} url={images[0]} rotation={[0, 0, 0.1]} />
        <DraggableImage position={[-1.5, -1, 0.1]} scale={1.4} url={images[1]} rotation={[0, 0, -0.2]} />
        <DraggableImage position={[0, 0.5, 0.2]} scale={1.9} url={images[2]} rotation={[0, 0, 0.05]} />
        <DraggableImage position={[1.5, -0.5, 0.1]} scale={1.6} url={images[3]} rotation={[0, 0, -0.1]} />
        <DraggableImage position={[3, 0.2, 0]} scale={1.5} url={images[4]} rotation={[0, 0, 0.15]} />
      </Float>
    </group>
  )
}

// --- SECTION 1: LANYARD BAND ---
function Band({ maxSpeed = 50, minSpeed = 10 }) {
  const band = useRef(), fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef()
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3()
  const { nodes, materials } = useGLTF('https://raw.githubusercontent.com/khyltarras-art/id-des/refs/heads/main/Card.glb')
  const texture = useTexture('https://raw.githubusercontent.com/khyltarras-art/id-des/refs/heads/main/band.png')
  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]))
  const [dragged, drag] = useState(false)

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]])

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)))
      })
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.lerped)
      curve.points[2].copy(j1.current.lerped)
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))
      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
    }
  })

  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} colliders={false}><BallCollider args={[0.1]} /></RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} colliders={false}><BallCollider args={[0.1]} /></RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} colliders={false}><BallCollider args={[0.1]} /></RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group scale={2.25} position={[0, -1.2, -0.05]} 
            onPointerDown={(e) => {
                e.target.setPointerCapture(e.pointerId)
                drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            }}
            onPointerUp={(e) => {
                e.target.releasePointerCapture(e.pointerId)
                drag(false)
            }}>
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial map={materials.base.map} clearcoat={1} clearcoatRoughness={0.15} roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial color="white" depthTest={false} resolution={[width, height]} useMap map={texture} repeat={[-3, 1]} lineWidth={1} />
      </mesh>
    </>
  )
}