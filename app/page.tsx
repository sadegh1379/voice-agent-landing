"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

// Neural Network / Graph Animation Component
interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
}

function NeuralNetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  const initNodes = useCallback((width: number, height: number) => {
    const nodeCount = Math.min(50, Math.floor((width * height) / 25000));
    const nodes: Node[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1.5,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    return nodes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      nodesRef.current = initNodes(canvas.width, canvas.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    const connectionDistance = 150;
    const mouseRadius = 200;

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      const time = Date.now() * 0.001;

      // Update nodes
      nodes.forEach((node) => {
        // Mouse interaction - gentle attraction
        const dx = mouseRef.current.x - node.x;
        const dy = mouseRef.current.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < mouseRadius && dist > 0) {
          const force = (mouseRadius - dist) / mouseRadius * 0.02;
          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;
        }

        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Damping
        node.vx *= 0.99;
        node.vy *= 0.99;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) {
          node.vx *= -1;
          node.x = Math.max(0, Math.min(canvas.width, node.x));
        }
        if (node.y < 0 || node.y > canvas.height) {
          node.vy *= -1;
          node.y = Math.max(0, Math.min(canvas.height, node.y));
        }

        // Add slight random movement
        node.vx += (Math.random() - 0.5) * 0.02;
        node.vy += (Math.random() - 0.5) * 0.02;

        // Limit velocity
        const maxVel = 1;
        const vel = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (vel > maxVel) {
          node.vx = (node.vx / vel) * maxVel;
          node.vy = (node.vy / vel) * maxVel;
        }
      });

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.4;
            
            // Create gradient for connection
            const gradient = ctx.createLinearGradient(
              nodes[i].x, nodes[i].y,
              nodes[j].x, nodes[j].y
            );
            gradient.addColorStop(0, `rgba(0, 212, 255, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(139, 92, 246, ${opacity * 0.8})`);
            gradient.addColorStop(1, `rgba(0, 212, 255, ${opacity})`);

            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 2 + node.pulsePhase) * 0.3 + 0.7;
        const glowRadius = node.radius * 3 * pulse;

        // Outer glow
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, glowRadius
        );
        gradient.addColorStop(0, `rgba(0, 212, 255, ${0.6 * pulse})`);
        gradient.addColorStop(0.5, `rgba(139, 92, 246, ${0.3 * pulse})`);
        gradient.addColorStop(1, "rgba(0, 212, 255, 0)");

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + pulse * 0.2})`;
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [initNodes]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.8 }}
    />
  );
}

// Voice Wave Animation Component
function VoiceWave() {
  return (
    <div className="flex items-center justify-center gap-2 h-24">
      {[...Array(9)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-[var(--accent)] to-[var(--accent-secondary)]"
          initial={{ height: 20 }}
          animate={{ 
            height: [20, 60 + Math.sin(i * 0.5) * 20, 20],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

// Floating Orbs Background Component
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        className="glow-orb glow-accent w-[600px] h-[600px] -top-40 -right-40"
        animate={{
          x: [0, 20, 0, -10, 0],
          y: [0, 15, 0, -10, 0],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="glow-orb glow-purple w-[500px] h-[500px] top-1/3 -left-40"
        animate={{
          x: [0, -15, 0, 10, 0],
          y: [0, 20, 0, -15, 0],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="glow-orb glow-accent w-[400px] h-[400px] bottom-20 right-1/4"
        animate={{
          x: [0, 15, 0, -10, 0],
          y: [0, -15, 0, 10, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

// Ripple Effect Component
function RippleEffect() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-40 h-40 rounded-full border-2 border-[var(--accent)]"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 1,
          }}
        />
      ))}
    </div>
  );
}

// Animated Logo Component
function AnimatedLogo() {
  return (
    <motion.div 
      className="flex items-center gap-3 cursor-pointer group"
      whileHover={{ scale: 1.02 }}
    >
      {/* Logo Icon */}
      <motion.div 
        className="relative w-10 h-10 flex items-center justify-center"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        {/* Outer ring */}
        <motion.div 
          className="absolute inset-0 rounded-full border-2 border-[var(--accent)] opacity-50"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner glow */}
        <motion.div 
          className="absolute inset-1 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] opacity-20"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Sound waves icon */}
        <svg 
          className="w-5 h-5 text-[var(--accent)] relative z-10" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <motion.path 
            d="M12 3v18M8 6v12M16 6v12M4 9v6M20 9v6"
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>
      
      {/* Logo Text */}
      <div className="flex flex-col">
        <motion.span 
          className="text-lg font-bold gradient-text leading-tight"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          دستیار صوتی
        </motion.span>
        <motion.span 
          className="text-xs text-gray-400 tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          VOICE AGENT
        </motion.span>
      </div>
    </motion.div>
  );
}

// Navigation Links
const navLinks = [
  { label: "ویژگی‌ها", href: "#features" },
  { label: "دمو", href: "#demo" },
  { label: "تماس", href: "#demo-form" },
];

// Navigation
function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "glass-strong py-3 shadow-lg shadow-black/20" 
          : "py-5 bg-transparent"
      }`}
    >
      {/* Gradient border bottom */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/30 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: scrolled ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />

      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <AnimatedLogo />

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link, index) => (
            <motion.a
              key={link.href}
              href={link.href}
              className="relative text-sm text-gray-300 hover:text-white transition-colors py-2 group"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              onMouseEnter={() => setActiveLink(link.href)}
              onMouseLeave={() => setActiveLink("")}
            >
              {link.label}
              {/* Animated underline */}
              <motion.span 
                className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]"
                initial={{ width: 0 }}
                animate={{ width: activeLink === link.href ? "100%" : 0 }}
                transition={{ duration: 0.3 }}
              />
              {/* Glow effect */}
              <motion.span 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-4 bg-[var(--accent)] blur-lg opacity-0 group-hover:opacity-30 transition-opacity"
              />
            </motion.a>
          ))}
        </div>

        {/* CTA Button */}
        <motion.a
          href="#demo-form"
          className="relative overflow-hidden group"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Button background */}
          <span className="relative z-10 flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] rounded-full">
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ✨
            </motion.span>
            درخواست دمو
          </span>
          
          {/* Shimmer effect */}
          <motion.span 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-full"
          />
          
          {/* Glow */}
          <span className="absolute inset-0 rounded-full bg-[var(--accent)] blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
        </motion.a>
      </div>
    </motion.nav>
  );
}

// Hero Section
function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Neural Network Background */}
      <div className="absolute inset-0 z-0">
        <NeuralNetworkCanvas />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--background)]/30 to-[var(--background)] z-[1]" />

      <motion.div style={{ y, opacity }} className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Voice Wave Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-8"
        >
          <VoiceWave />
        </motion.div>

        {/* Main Title */}
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <span className="gradient-text-animated">صدایی</span>
          <br />
          <span className="text-white">که می‌فهمد.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-xl md:text-2xl text-gray-400 mb-12 font-light"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          دستیار صوتی فارسی، <span className="text-[var(--accent)]">دقیق‌تر از انسان.</span>
        </motion.p>

     

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        >
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center pt-2">
            <motion.div
              className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Ripple Background Effect */}
      <RippleEffect />
    </section>
  );
}

// Value Shots Section
function ValueShots() {
  const values = [
    { icon: "🎯", text: "درک دقیق لهجه‌ها" },
    { icon: "🔮", text: "اصلاح هوشمند گفتار" },
    { icon: "⚡", text: "پاسخ سریع و طبیعی" },
  ];

  return (
    <section className="py-32 relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="grid md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {values.map((value, index) => (
            <motion.div
              key={index}
              className="card-glow p-10 text-center hover-lift"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="text-5xl mb-6"
                whileHover={{ scale: 1.2, rotate: 10 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {value.icon}
              </motion.div>
              <h3 className="text-2xl font-bold text-white">{value.text}</h3>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Curious Section
function CuriousSection() {
  const bullets = [
    "مکالمه روان",
    "فهم واقعی",
    "تعامل بدون انتظار",
  ];

  return (
    <section className="py-32 relative z-10">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-16"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, filter: "blur(0)" }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            چرا همه درباره‌اش{" "}
            <span className="gradient-text">حرف می‌زنند؟</span>
          </motion.h2>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {bullets.map((bullet, index) => (
            <motion.div
              key={index}
              className="glass px-8 py-4 rounded-full animate-border-dance"
              variants={scaleIn}
              whileHover={{
                scale: 1.1,
                boxShadow: "0 0 30px rgba(0, 212, 255, 0.3)",
              }}
            >
              <span className="text-lg text-gray-300">{bullet}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Demo Section
// Live Voice Waveform Component
function LiveVoiceWaveform({ isActive }: { isActive: boolean }) {
  const bars = 40;
  
  return (
    <div className="flex items-center justify-center gap-[2px] h-16 px-4">
      {[...Array(bars)].map((_, i) => {
        const centerDistance = Math.abs(i - bars / 2) / (bars / 2);
        const maxHeight = 60 - centerDistance * 40;
        
        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-t from-[var(--accent)] via-[var(--accent-secondary)] to-[var(--accent)]"
            animate={isActive ? {
              height: [
                8,
                maxHeight * (0.3 + Math.random() * 0.7),
                maxHeight * (0.2 + Math.random() * 0.8),
                maxHeight * (0.4 + Math.random() * 0.6),
                8
              ],
              opacity: [0.5, 1, 0.8, 1, 0.5]
            } : {
              height: 8,
              opacity: 0.3
            }}
            transition={{
              duration: isActive ? 0.8 + Math.random() * 0.4 : 0.3,
              repeat: isActive ? Infinity : 0,
              ease: "easeInOut",
              delay: i * 0.02
            }}
          />
        );
      })}
    </div>
  );
}

// Conversation Message Component
function ConversationMessage({ 
  text, 
  isAI, 
  delay 
}: { 
  text: string; 
  isAI: boolean; 
  delay: number;
}) {
  return (
    <motion.div
      className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-3`}
      initial={{ opacity: 0, x: isAI ? -20 : 20, scale: 0.9 }}
      whileInView={{ opacity: 1, x: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
        isAI 
          ? 'bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent-secondary)]/20 border border-[var(--accent)]/30 rounded-tr-sm' 
          : 'bg-white/10 border border-white/10 rounded-tl-sm'
      }`}>
        {isAI && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[var(--accent)] text-xs font-medium">دستیار صوتی</span>
          </div>
        )}
        <p className={`text-sm ${isAI ? 'text-gray-200' : 'text-gray-300'}`}>{text}</p>
      </div>
    </motion.div>
  );
}

function DemoSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const conversation = [
    { text: "سلام، نمی‌تونم وارد حسابم بشم. رمزم رو یادم نمیاد", isAI: false },
    { text: "سلام! نگران نباشید. برای بازیابی رمز، شماره موبایلتون رو بگید تا کد تأیید بفرستم.", isAI: true },
    { text: "۰۹۱۲۳۴۵۶۷۸۹", isAI: false },
    { text: "کد ۴ رقمی به شمارتون ارسال شد. لطفاً کد رو بخونید.", isAI: true },
    { text: "۷۲۴۸", isAI: false },
    { text: "عالی! رمز جدید به پیامک ارسال شد. الان می‌تونید وارد بشید. کمک دیگه‌ای نیاز دارید؟", isAI: true },
  ];

  useEffect(() => {
    if (isPlaying && currentStep < conversation.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep, conversation.length]);

  const handlePlay = () => {
    if (!isPlaying) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <section id="demo" className="py-32 relative z-10">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            🎙️ دموی زنده
          </motion.span>
          
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-white">گوش کن.</span>
            <br />
            <span className="gradient-text-animated">شگفت‌زده شو.</span>
          </motion.h2>

          <motion.p
            className="text-gray-400 text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            یک مکالمه واقعی با دستیار صوتی ما. بدون اسکریپت، بدون ویرایش.
          </motion.p>
        </motion.div>

        {/* Demo Card */}
        <motion.div
          className="relative max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {/* Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-[var(--accent)]/20 via-[var(--accent-secondary)]/20 to-[var(--accent)]/20 rounded-3xl blur-2xl opacity-50" />
          
          {/* Main Card */}
          <div className="relative glass-strong rounded-3xl overflow-hidden border border-white/10">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-gray-400 text-sm">مکالمه زنده</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.div 
                  className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500' : 'bg-gray-500'}`}
                  animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-xs text-gray-500">{isPlaying ? 'در حال پخش' : 'آماده'}</span>
              </div>
            </div>

            {/* Waveform */}
            <div className="px-6 py-6 border-b border-white/5 bg-black/20">
              <LiveVoiceWaveform isActive={isPlaying} />
            </div>

            {/* Conversation */}
            <div className="px-6 py-6 min-h-[200px] max-h-[300px] overflow-y-auto">
              {conversation.slice(0, isPlaying ? currentStep : 0).map((msg, index) => (
                <ConversationMessage
                  key={index}
                  text={msg.text}
                  isAI={msg.isAI}
                  delay={0}
                />
              ))}
              
              {!isPlaying && currentStep === 0 && (
                <div className="flex items-center justify-center h-full py-8">
                  <p className="text-gray-500 text-sm">برای شروع دمو کلیک کنید</p>
                </div>
              )}

              {isPlaying && currentStep >= conversation.length && (
                <motion.div
                  className="text-center py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="text-[var(--accent)] text-sm">✨ مکالمه کامل شد</span>
                </motion.div>
              )}
            </div>

            {/* Controls */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-center">
              <motion.button
                className={`relative flex items-center gap-3 px-8 py-3 rounded-full font-medium transition-all ${
                  isPlaying 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-white'
                }`}
                onClick={handlePlay}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      ⏳
                    </motion.div>
                    توقف
                  </>
                ) : (
                  <>
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ▶️
                    </motion.span>
                    پخش دمو
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Text */}
        <motion.p
          className="text-center text-gray-500 text-sm mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          «این فقط یک نمونه از هزاران مکالمه روزانه ماست.»
        </motion.p>
      </div>
    </section>
  );
}

// Social Proof Section
function SocialProof() {
  const proofs = [
    { value: "پیشرو", label: "استفاده در کسب‌وکارهای پیشرو" },
    { value: "+۹۵٪", label: "دقت در تشخیص گفتار" },
    { value: "۲۴/۷", label: "پشتیبانی شبانه‌روزی" },
  ];

  return (
    <section className="py-24 relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="section-divider mb-16" />
        
        <motion.div
          className="grid md:grid-cols-3 gap-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {proofs.map((proof, index) => (
            <motion.div
              key={index}
              className="text-center"
              variants={fadeInUp}
            >
              <motion.div
                className="text-4xl md:text-5xl font-black gradient-text mb-3"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring" }}
              >
                {proof.value}
              </motion.div>
              <p className="text-gray-400">{proof.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="section-divider mt-16" />
      </div>
    </section>
  );
}

// Final CTA Section
function FinalCTA() {
  return (
    <section className="py-32 relative z-10">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.h2
          className="text-4xl md:text-5xl font-bold mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          آماده‌اید صدای برندتان را{" "}
          <span className="gradient-text">ارتقا دهید؟</span>
        </motion.h2>

        <motion.a
          href="#demo-form"
          className="btn-primary inline-block text-lg mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          گفتگو با ما
        </motion.a>

        <motion.p
          className="text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          «برای تیم‌هایی که کیفیت برایشان مهم است.»
        </motion.p>
      </div>
    </section>
  );
}

// Demo Request Form Section
function DemoRequestForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", phone: "" });
      } else {
        setStatus("error");
        setErrorMessage(data.error || "خطایی رخ داد");
      }
    } catch {
      setStatus("error");
      setErrorMessage("خطا در ارسال درخواست");
    }
  };

  return (
    <section id="demo-form" className="py-32 relative z-10">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          className="card-glow p-10 md:p-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">درخواست دمو</span>
            </h2>
            <p className="text-gray-400">
              فرم زیر را پر کنید، با شما تماس می‌گیریم.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-10"
              >
                <motion.div
                  className="text-6xl mb-4"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  ✅
                </motion.div>
                <h3 className="text-2xl font-bold text-[var(--accent)] mb-2">
                  درخواست شما ثبت شد!
                </h3>
                <p className="text-gray-400">
                  به زودی با شما تماس می‌گیریم.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-gray-300 mb-2 text-sm">
                    نام و نام خانوادگی
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="مثال: علی محمدی"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-gray-300 mb-2 text-sm">
                    ایمیل
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="example@email.com"
                    dir="ltr"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="block text-gray-300 mb-2 text-sm">
                    شماره تماس
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </motion.div>

                {status === "error" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-sm text-center"
                  >
                    {errorMessage}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  className="btn-primary w-full text-lg"
                  disabled={status === "loading"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  {status === "loading" ? (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      در حال ارسال...
                    </motion.span>
                  ) : (
                    "ارسال درخواست"
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="py-12 border-t border-[var(--border-subtle)] relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.div
            className="text-2xl font-bold gradient-text"
            whileHover={{ scale: 1.05 }}
          >
            دستیار صوتی فارسی
          </motion.div>
          <p className="text-gray-500 text-sm">
            © ۱۴۰۳ تمامی حقوق محفوظ است.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--background)] overflow-hidden">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Floating Background Orbs */}
      <FloatingOrbs />

      {/* Cursor Glow Effect */}
      <motion.div
        className="cursor-glow hidden md:block"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
        animate={{
          x: mousePosition.x - 200,
          y: mousePosition.y - 200,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main>
        <HeroSection />
        <ValueShots />
        <CuriousSection />
        <DemoSection />
        <SocialProof />
        <FinalCTA />
        <DemoRequestForm />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
