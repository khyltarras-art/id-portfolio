import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
// --- FIX: Added 'Svg' to this import line ---
import { useGLTF, useTexture, Environment, Lightformer, Text, Image, Float, Svg } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

extend({ MeshLineGeometry, MeshLineMaterial })

// --- ASSETS PRELOAD ---
useGLTF.preload('https://raw.githubusercontent.com/khyltarras-art/id-des/refs/heads/main/Card.glb')
useTexture.preload('https://raw.githubusercontent.com/khyltarras-art/id-des/refs/heads/main/band.png')

// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    // Height 300vh = 3 Sections
    <div style={{ height: '300vh', width: '100%', backgroundColor: '#111' }}>
      
      {/* Fixed Canvas */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', overflow: 'hidden' }}>
        <Canvas camera={{ position: [0, 0, 15], fov: 25 }}>
          
          {/* Scroll Logic */}
          <CameraScrollRig />
          
          <ambientLight intensity={Math.PI} />

          {/* --- SECTION 1: ID CARD --- */}
          <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
            <Band />
          </Physics>
          <Text position={[0, 0, -5]} fontSize={4.5} color="#fc568d" anchorX="center" anchorY="middle" font="/Postertoaster.woff">
            PORTFOLIO
          </Text>

          {/* --- SECTION 2: POLAROIDS --- */}
          <SecondSection />

          {/* --- SECTION 3: SKILLS & INFO --- */}
          <ThirdSection />
          
          {/* Lighting Environment */}
          <Environment background blur={0.75}>
            <color attach="background" args={['black']} />
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

// --- COMPONENT: CAMERA SCROLL RIG ---
function CameraScrollRig() {
  const { camera, viewport } = useThree()
  const scrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress (0 to 1) over total scrollable height
      const totalHeight = document.body.scrollHeight - window.innerHeight
      scrollY.current = window.scrollY / totalHeight
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useFrame((state, delta) => {
    // We have 3 sections, so we move down 2 viewport heights total
    // Section 1: Y=0 | Section 2: Y=-viewport | Section 3: Y=-2*viewport
    const targetY = -scrollY.current * (viewport.height * 2)
    
    // Zoom Logic: 15 (start) -> 12 (mid) -> 14 (end)
    const targetZ = 15 - (scrollY.current * 2) 

    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 4)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 4)
  })
  return null
}

// --- COMPONENT: SECTION 2 (POLAROIDS) ---
function SecondSection() {
  const { viewport } = useThree()
  const textRef = useRef()
  
  // Position: 1 Full Screen Down
  const yOffset = -viewport.height

  // Parallax Effect for "KHYL" Text
  useFrame((state, delta) => {
    if (textRef.current) {
      // Moves opposite to mouse movement
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
      {/* Background Parallax Text */}
      <group position={[0, 0, -5]} ref={textRef}>
        <Text fontSize={4.5} color="white" font="/Postertoaster.woff" anchorX="center" anchorY="middle">
          KHYL
        </Text>
      </group>

      {/* Floating Images */}
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        <DraggableImage position={[-3, 0, 0]} scale={1.2} url={images[0]} rotation={[0, 0, 0.1]} />
        <DraggableImage position={[-1.5, -1, 0.1]} scale={1} url={images[1]} rotation={[0, 0, -0.2]} />
        <DraggableImage position={[0, 0.5, 0.2]} scale={1.4} url={images[2]} rotation={[0, 0, 0.05]} />
        <DraggableImage position={[1.5, -0.5, 0.1]} scale={1.1} url={images[3]} rotation={[0, 0, -0.1]} />
        <DraggableImage position={[3, 0.2, 0]} scale={1} url={images[4]} rotation={[0, 0, 0.15]} />
      </Float>
    </group>
  )
}

// --- COMPONENT: SECTION 3 (ABOUT & SKILLS - WITH SVG) ---
function ThirdSection() {
  const { viewport } = useThree()
  const yOffset = -viewport.height * 2

  return (
    <group position={[0, yOffset, 0]}>
      
      {/* --- LEFT SIDE: ABOUT & EDUCATION --- */}
      <group position={[-2.5, 0, 0]}>
        {/* About Me */}
        <group position={[-1, 1.2, 0]}>
          <Text fontSize={0.5} color="#fc568d" font="/Postertoaster.woff" anchorX="left" position={[-2, 1, 0]}>
            ABOUT ME
          </Text>
          <Text maxWidth={4} fontSize={0.13} color="#cccccc" anchorX="left" anchorY="top" position={[-2, 0.5, 0]} lineHeight={1.6}>
            I am an Industrial Engineering student based in Laguna, bridging the gap between technical logic and creative artistry.
            Passionate about motion graphics, filmmaking, and event production.
          </Text>
        </group>

        {/* Education */}
        <group position={[-1, -1.8, 0]}>
          <Text fontSize={0.5} color="#fc568d" font="/Postertoaster.woff" anchorX="left" position={[-2, 1, 0]}>
            EDUCATION
          </Text>
          <Text maxWidth={4} fontSize={0.13} color="#cccccc" anchorX="left" anchorY="top" position={[-2, 0.5, 0]} lineHeight={1.6}>
            BS Industrial Engineering{'\n'}
            4 Years in VP Creatives Positions{'\n'}
            AWS Cloud Club PUP - Motion Designer{'\n'}
            Scholar at DataCamp
          </Text>
        </group>
      </group>

      {/* --- RIGHT SIDE: TECHNICAL SKILLS (SVG ICONS) --- */}
      <group position={[2.5, 0, 0]}>
        <Text position={[0, 2.5, 0]} fontSize={0.8} color="#6366f1" font="/Postertoaster.woff" anchorX="center">
          TECHNICAL SKILLS
        </Text>
        
        {/* SVG Icon Grid */}
        <group position={[0, 0.5, 0]}>
            {/* Row 1 */}
            <SkillIcon 
              position={[-1, 1, 0]} 
              url="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg" 
              color="#31a8ff" 
            />
            <SkillIcon 
              position={[0, 1, 0]} 
              url="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/illustrator/illustrator-plain.svg" 
              color="#ff9a00" 
            />
            <SkillIcon 
              position={[1, 1, 0]} 
              url="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/aftereffects/aftereffects-plain.svg" 
              color="#cf96fd" 
            />
            
            {/* Row 2 */}
            <SkillIcon 
              position={[-1, -0.2, 0]} 
              url="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/premierepro/premierepro-plain.svg" 
              color="#9999ff" 
            />
            <SkillIcon 
              position={[0, -0.2, 0]} 
              url="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unrealengine/unrealengine-original.svg" 
              color="white" 
              scaleAdjustment={0.8} 
            />
            <SkillIcon 
              position={[1, -0.2, 0]} 
              url="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/blender/blender-original.svg" 
              color="#e87d0d" 
            />
        </group>
      </group>
    </group>
  )
}

// --- HELPER: SKILL ICON (SVG VERSION) ---
function SkillIcon({ position, url, color, scaleAdjustment = 1 }) {
    const [hovered, setHover] = useState(false)
    const baseScale = 0.005 * scaleAdjustment

    return (
      <group 
        position={position} 
        onPointerOver={() => setHover(true)} 
        onPointerOut={() => setHover(false)}
        scale={hovered ? 1.1 : 1}
      >
        <mesh>
          <planeGeometry args={[0.8, 0.8]} />
          <meshBasicMaterial color={hovered ? '#333' : '#1a1a1a'} />
        </mesh>
        
        <mesh position={[0, -0.38, 0.01]}>
           <planeGeometry args={[0.7, 0.05]} />
           <meshBasicMaterial color={color} />
        </mesh>

        <group position={[-0.25, 0.25, 0.01]} scale={[1, -1, 1]}> 
             <Svg src={url} scale={baseScale} />
        </group>
      </group>
    )
  }

// --- HELPER: DRAGGABLE IMAGE ---
function DraggableImage({ position, scale, url, rotation = [0, 0, 0] }) {
    const ref = useRef()
    const groupRef = useRef()
    const [hovered, setHover] = useState(false)
    const [dragging, setDragging] = useState(false)
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
    const offset = useRef(new THREE.Vector3())
    const intersectPoint = useRef(new THREE.Vector3())
    const { camera } = useThree()

    useFrame((state) => {
        if (dragging && groupRef.current) {
            state.raycaster.ray.intersectPlane(plane, intersectPoint.current)
            groupRef.current.position.subVectors(intersectPoint.current, offset.current)
        }
    })

    const handlePointerDown = (e) => {
        e.stopPropagation()
        e.ray.intersectPlane(plane, intersectPoint.current)
        offset.current.subVectors(intersectPoint.current, groupRef.current.position)
        e.target.setPointerCapture(e.pointerId)
        setDragging(true)
    }

    const handlePointerUp = (e) => {
        e.stopPropagation()
        e.target.releasePointerCapture(e.pointerId)
        setDragging(false)
    }

    useEffect(() => {
        document.body.style.cursor = dragging ? 'grabbing' : (hovered ? 'grab' : 'auto')
    }, [hovered, dragging])

    return (
        <group ref={groupRef} position={position} rotation={rotation}>
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[scale * 1.15, scale * 1.4 * 1.25]} />
                <meshBasicMaterial color="#f4f4f4" side={THREE.DoubleSide} />
            </mesh>
            <Image
                ref={ref}
                url={url}
                position={[0, scale * 0.1, 0.01]} 
                scale={[scale, scale * 1.4]}
                transparent
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
            />
        </group>
    )
}

// --- HELPER: PHYSICS BAND ---
function Band({ maxSpeed = 50, minSpeed = 10 }) {
  const band = useRef(), fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef()
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3()
  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 2, linearDamping: 2 }
  const { nodes, materials } = useGLTF('https://raw.githubusercontent.com/khyltarras-art/id-des/refs/heads/main/Card.glb')
  const texture = useTexture('https://raw.githubusercontent.com/khyltarras-art/id-des/refs/heads/main/band.png')
  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]))
  const [dragged, drag] = useState(false)
  const [hovered, hover] = useState(false)

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]])

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab'
      return () => void (document.body.style.cursor = 'auto')
    }
  }, [hovered, dragged])

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }
    if (fixed.current) {
      ;[j1, j2].forEach((ref) => {
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

  curve.curveType = 'chordal'
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}><BallCollider args={[0.1]} /></RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}><BallCollider args={[0.1]} /></RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}><BallCollider args={[0.1]} /></RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={(e) => (e.target.setPointerCapture(e.pointerId), drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation()))))}>
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial map={materials.base.map} map-anisotropy={16} clearcoat={1} clearcoatRoughness={0.15} roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
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