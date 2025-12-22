import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Environment, Lightformer, Text, Image, Float } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

extend({ MeshLineGeometry, MeshLineMaterial })

// Preload assets
useGLTF.preload('https://raw.githubusercontent.com/khyltarras-art/id-des/refs/heads/main/Card.glb')
useTexture.preload('https://raw.githubusercontent.com/khyltarras-art/id-des/refs/heads/main/band.png')

export default function App() {
  return (
    // Outer container allows scrolling (200vh height = 2 pages)
    <div style={{ height: '200vh', width: '100%', backgroundColor: '#111' }}>
      
      {/* Fixed Canvas: Stays put while you scroll */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', overflow: 'hidden' }}>
        <Canvas camera={{ position: [0, 0, 15], fov: 25 }}>
          {/* Controls Camera Movement based on Scroll */}
          <CameraScrollRig />
          
          <ambientLight intensity={Math.PI} />
          
          {/* SECTION 1: ID CARD (Physics) */}
          {/* We keep this at Y=0 */}
          <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
            <Band />
          </Physics>
          {/* Background Text for Section 1 */}
          <Text position={[0, 0, -5]} fontSize={4.5} color="#fc568d" anchorX="center" anchorY="middle" font="/Postertoaster.woff">
            PORTFOLIO
          </Text>

          {/* SECTION 2: DRAGGABLE IMAGES */}
          {/* We position this exactly one viewport height below the first section */}
          <SecondSection />
          
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

// --- CAMERA SCROLL RIG ---
// This smoothly moves the camera down as you scroll the HTML page
function CameraScrollRig() {
  const { camera, viewport } = useThree()
  const scrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll percentage (0 to 1)
      const totalHeight = document.body.scrollHeight - window.innerHeight
      scrollY.current = window.scrollY / totalHeight
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useFrame((state, delta) => {
    // Target Y position: 0 when top, -viewport.height when bottom
    const targetY = -scrollY.current * viewport.height
    
    // Smoothly lerp camera position
    // We adjust the Z slightly too (15 to 12) for a nice zoom-in effect on the photos
    const targetZ = 15 - (scrollY.current * 3) 

    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 4) // Speed 4
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 4)
  })
  return null
}

// --- SECTION 2 COMPONENT ---
function SecondSection() {
  const { viewport } = useThree()
  
  // Position it one full screen down
  const yOffset = -viewport.height

  const images = [
    "https://raw.githubusercontent.com/khyltarras-art/id-portfolio/refs/heads/main/imgs/1.jpg",
    "https://raw.githubusercontent.com/khyltarras-art/id-portfolio/refs/heads/main/imgs/2.png",
    "https://raw.githubusercontent.com/khyltarras-art/id-portfolio/refs/heads/main/imgs/3.png",
    "https://images.unsplash.com/photo-1620428268482-cf1851a36764?q=80&w=2609&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1602212096437-d0af1ce0553e?q=80&w=2671&auto=format&fit=crop"
  ]

  return (
    <group position={[0, yOffset, 0]}>
      
      {/* Title - MATCHING "PORTFOLIO" STYLE */}
      {/* Positioned at Z=-5 (behind), centered, same font size */}
      <Text 
        position={[0, 0, -5]} 
        fontSize={4.5} 
        color="white" 
        font="/Postertoaster.woff" 
        anchorX="center" 
        anchorY="middle"
      >
        KHYL
      </Text>

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
// --- EXACT CURSOR DRAG COMPONENT (POLAROID) ---
function DraggableImage({ position, scale, url, rotation = [0, 0, 0] }) {
    const ref = useRef()
    const groupRef = useRef()
    const [hovered, setHover] = useState(false)
    const [dragging, setDragging] = useState(false)
    
    // Create an infinite plane at Z=0 to capture mouse movement
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
    const offset = useRef(new THREE.Vector3())
    const intersectPoint = useRef(new THREE.Vector3())

    const { camera } = useThree()

    useFrame((state) => {
        if (dragging && groupRef.current) {
            // Calculate where the mouse is pointing on the Z=0 plane
            state.raycaster.ray.intersectPlane(plane, intersectPoint.current)
            // Apply that position minus the initial offset
            groupRef.current.position.subVectors(intersectPoint.current, offset.current)
        }
    })

    const handlePointerDown = (e) => {
        e.stopPropagation() // Stop click from passing through
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

    // Dimensions
    const imgWidth = scale;
    const imgHeight = scale * 1.4;
    const frameWidth = imgWidth * 1.15; 
    const frameHeight = imgHeight * 1.25;
    const imgYOffset = scale * 0.1; 

    return (
        <group ref={groupRef} position={position} rotation={rotation}>
            {/* Polaroid Frame */}
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[frameWidth, frameHeight]} />
                <meshBasicMaterial color="#f4f4f4" side={THREE.DoubleSide} />
            </mesh>
            {/* Image */}
            <Image
                ref={ref}
                url={url}
                position={[0, imgYOffset, 0.01]} 
                scale={[imgWidth, imgHeight]}
                transparent
                opacity={1}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
            />
        </group>
    )
}

// --- BAND COMPONENT (ID CARD - Unchanged Logic) ---
function Band({ maxSpeed = 50, minSpeed = 10 }) {
  const band = useRef(), fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef() // prettier-ignore
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3() // prettier-ignore
  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 2, linearDamping: 2 }
  const { nodes, materials } = useGLTF('https://raw.githubusercontent.com/khyltarras-art/id-des/refs/heads/main/Card.glb')
  const texture = useTexture('https://raw.githubusercontent.com/khyltarras-art/id-des/refs/heads/main/band.png')
  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]))
  const [dragged, drag] = useState(false)
  const [hovered, hover] = useState(false)

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]) // prettier-ignore

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
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
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