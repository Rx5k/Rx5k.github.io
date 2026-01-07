class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 2 + 0.5;
        this.baseOpacity = Math.random() * 0.6 + 0.3;
        this.opacity = this.baseOpacity;
        this.hue = Math.random() * 30 + 200;
        this.saturation = Math.random() * 30 + 20;
        this.brightness = Math.random() * 30 + 70;
        this.twinkleSpeed = Math.random() * 0.02 + 0.01;
        this.twinkleOffset = Math.random() * Math.PI * 2;
    }

    update(mouseX, mouseY, mouseActive, time, baseMovement, isTouchDevice = false) {
        const randomForce = 0.02;
        this.vx += (Math.random() - 0.5) * randomForce;
        this.vy += (Math.random() - 0.5) * randomForce;
        this.x += this.vx + baseMovement.x * 0.1;
        this.y += this.vy + baseMovement.y * 0.1;

        if (mouseActive) {
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 200;

            if (distance < maxDistance && distance > 0) {
                const baseForce = isTouchDevice ? 0.006 : 0.005;
                const normalizedDx = dx / distance;
                const normalizedDy = dy / distance;
                const force = (maxDistance - distance) / maxDistance * baseForce;
                this.vx += normalizedDx * force;
                this.vy += normalizedDy * force;
                const colorIntensity = 1 - (distance / maxDistance) * 0.4;
                this.opacity = this.baseOpacity * (1 + colorIntensity * 0.6);
            } else {
                this.opacity = this.baseOpacity;
            }
        } else {
            this.opacity = this.baseOpacity;
            const dispersionForce = 0.001;
            this.vx += (Math.random() - 0.5) * dispersionForce;
            this.vy += (Math.random() - 0.5) * dispersionForce;
        }

        const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.2 + 0.8;
        this.opacity *= twinkle;

        const damping = mouseActive ? 0.995 : 0.992;
        this.vx *= damping;
        this.vy *= damping;
        const maxSpeed = mouseActive ? 2 : 1.5;
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > maxSpeed) {
            this.vx = (this.vx / currentSpeed) * maxSpeed;
            this.vy = (this.vy / currentSpeed) * maxSpeed;
        }

        if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1;
    }

    draw() {
        const gradient = this.ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 3
        );
        gradient.addColorStop(0, `hsla(${this.hue}, ${this.saturation}%, ${this.brightness}%, ${this.opacity})`);
        gradient.addColorStop(0.5, `hsla(${this.hue}, ${this.saturation}%, ${this.brightness}%, ${this.opacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${this.hue}, ${this.saturation}%, ${this.brightness}%, 0)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.x - this.radius * 3, this.y - this.radius * 3, this.radius * 6, this.radius * 6);
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.brightness}%, ${this.opacity})`;
        this.ctx.fill();
    }
}

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouseX = canvas.width / 2;
        this.mouseY = canvas.height / 2;
        this.mouseActive = false;
        this.time = 0;
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.updateParticleCount();

        this.resize();
        this.init();
        this.animate();
        this.setupMouseTracking();
        this.setupTouchTracking();

        window.addEventListener('resize', () => {
            this.resize();
            this.updateParticleCount();
            this.init();
        });
    }

    updateParticleCount() {
        const area = window.innerWidth * window.innerHeight;
        if (window.innerWidth < 768) {
            this.particleCount = Math.floor(area / 20000);
        } else {
            this.particleCount = Math.floor(area / 15000);
        }
        this.particleCount = Math.max(20, Math.min(100, this.particleCount));
    }

    setupMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.mouseActive = true;
        });

        document.addEventListener('mouseleave', () => {
            this.mouseActive = false;
        });
    }

    setupTouchTracking() {
        let lastTouchUpdate = 0;
        document.addEventListener('touchmove', (e) => {
            const now = Date.now();
            if (now - lastTouchUpdate < 16) return;
            lastTouchUpdate = now;
            const touch = e.touches[0];
            if (touch) {
                this.mouseX = touch.clientX;
                this.mouseY = touch.clientY;
                this.mouseActive = true;
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            this.mouseActive = false;
        }, { passive: true });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.canvas));
        }
    }

    animate() {
        this.time += 0.016;
        const baseMovement = {
            x: Math.sin(this.time * 0.1) * 0.2,
            y: Math.cos(this.time * 0.1) * 0.2
        };
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            particle.update(this.mouseX, this.mouseY, this.mouseActive, this.time, baseMovement, this.isTouchDevice);
            particle.draw();
        });

        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 180) {
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    const mouseDx = this.mouseX - midX;
                    const mouseDy = this.mouseY - midY;
                    const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
                    const mouseInfluence = Math.max(0, 1 - mouseDistance / 250);
                    const baseOpacity = 0.12 * (1 - distance / 180);
                    const enhancedOpacity = baseOpacity + (mouseInfluence * 0.25);
                    const finalOpacity = this.mouseActive
                        ? Math.min(0.5, enhancedOpacity)
                        : Math.min(0.2, baseOpacity * 0.6);
                    const hue = 200 + (mouseInfluence * 30);
                    if (finalOpacity > 0.05) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.strokeStyle = `hsla(${hue}, 50%, 80%, ${finalOpacity})`;
                        this.ctx.lineWidth = 0.3 + (mouseInfluence * 0.7);
                        this.ctx.stroke();
                    }
                }
            });
        });

        requestAnimationFrame(() => this.animate());
    }
}

const clickEffectStyle = document.createElement('style');
clickEffectStyle.textContent = `
    @keyframes rippleExpandCool {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.8;
        }
        50% {
            opacity: 0.6;
        }
        100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
        }
    }

    @keyframes particleExplode {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
        }
    }
`;
document.head.appendChild(clickEffectStyle);

document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);
    const canvas = document.getElementById('particles');
    new ParticleSystem(canvas);

    const mouseGradient = document.querySelector('.mouse-gradient');
    const updateGradient = (x, y) => {
        if (!mouseGradient) return;
        const percentX = (x / window.innerWidth) * 100;
        const percentY = (y / window.innerHeight) * 100;
        mouseGradient.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(50, 80, 120, 0.3) 0%, transparent 60%)`;
        mouseGradient.classList.add('active');
    };
    document.addEventListener('mousemove', (e) => {
        updateGradient(e.clientX, e.clientY);
    });

    document.addEventListener('mouseleave', () => {
        if (mouseGradient) {
            mouseGradient.classList.remove('active');
        }
    });

    let lastGradientUpdate = 0;
    document.addEventListener('touchmove', (e) => {
        const now = Date.now();
        if (now - lastGradientUpdate < 50) return;
        lastGradientUpdate = now;
        const touch = e.touches[0];
        if (touch) {
            updateGradient(touch.clientX, touch.clientY);
        }
    }, { passive: true });

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const createClickEffect = (x, y, isTouch = false) => {
        const ripplesContainer = document.querySelector('.click-ripples');
        if (!ripplesContainer) return;

        const rippleCount = isTouch ? 1 : 2;
        const particleCount = isTouch ? 0 : 4;
        const opacityMultiplier = isTouch ? 0.4 : 1;
        const sizeMultiplier = isTouch ? 0.7 : 1;

        for (let i = 0; i < rippleCount; i++) {
            const ripple = document.createElement('div');
            const delay = i * 0.1;
            const size = (50 + (i * 25)) * sizeMultiplier;
            ripple.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                border: 1.5px solid rgba(150, 200, 255, ${(0.4 - i * 0.1) * opacityMultiplier});
                transform: translate(-50%, -50%) scale(0);
                pointer-events: none;
                animation: rippleExpandCool ${0.5 + i * 0.1}s ease-out ${delay}s forwards;
                box-shadow: 0 0 ${(12 + i * 4) * sizeMultiplier}px rgba(150, 200, 255, ${(0.25 - i * 0.06) * opacityMultiplier});
            `;
            ripplesContainer.appendChild(ripple);
            setTimeout(() => ripple.remove(), (0.5 + i * 0.1 + delay) * 1000);
        }

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            const angle = (Math.PI * 2 / particleCount) * i;
            const distance = 30 + Math.random() * 20;
            const finalX = x + Math.cos(angle) * distance;
            const finalY = y + Math.sin(angle) * distance;
            particle.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: 3px;
                height: 3px;
                background: radial-gradient(circle, rgba(150, 200, 255, 0.7), transparent);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                animation: particleExplode 0.6s ease-out forwards;
                box-shadow: 0 0 6px rgba(150, 200, 255, 0.6);
            `;
            ripplesContainer.appendChild(particle);
            setTimeout(() => {
                particle.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                particle.style.left = `${finalX}px`;
                particle.style.top = `${finalY}px`;
                particle.style.opacity = '0';
                particle.style.transform = 'translate(-50%, -50%) scale(0)';
            }, 10);
            setTimeout(() => particle.remove(), 700);
        }
    };

    document.addEventListener('click', (e) => {
        createClickEffect(e.clientX, e.clientY, false);
    });

    document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        createClickEffect(touch.clientX, touch.clientY, true);
    }, { passive: true });
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    document.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const distance = Math.sqrt(
                Math.pow(e.clientX - dragStartX, 2) +
                Math.pow(e.clientY - dragStartY, 2)
            );
            if (distance > 30 && Math.random() > 0.9) {
                createClickEffect(e.clientX, e.clientY, false);
            }
        }
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    let touchMoveCount = 0;
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            touchMoveCount++;
            if (touchMoveCount % 30 === 0) {
                const touch = e.touches[0];
                const ripplesContainer = document.querySelector('.click-ripples');
                if (ripplesContainer) {
                    const ripple = document.createElement('div');
                    ripple.style.cssText = `
                        position: absolute;
                        left: ${touch.clientX}px;
                        top: ${touch.clientY}px;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        border: 1px solid rgba(150, 200, 255, 0.2);
                        transform: translate(-50%, -50%) scale(0);
                        pointer-events: none;
                        animation: rippleExpandCool 0.4s ease-out forwards;
                        box-shadow: 0 0 8px rgba(150, 200, 255, 0.15);
                    `;
                    ripplesContainer.appendChild(ripple);
                    setTimeout(() => ripple.remove(), 400);
                }
            }
        }
    }, { passive: true });


    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { 
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    let scrolled = false;
    let scrollTimeout = null;
    const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollY = window.scrollY;
            const initialView = document.querySelector('.initial-view');
            const scrollHint = document.querySelector('.scroll-hint');
            const scrollErrorCode = document.querySelector('.scroll-error-code');
            if (scrollY > 100 && !scrolled) {
                scrolled = true;
                if (initialView) {
                    initialView.style.transition = 'opacity 0.5s ease-out';
                    initialView.style.opacity = '0';
                    if (scrollHint) {
                        scrollHint.style.opacity = '0';
                    }
                    setTimeout(() => {
                        if (initialView.style.opacity === '0') {
                            initialView.style.display = 'none';
                            if (scrollErrorCode) {
                                scrollErrorCode.classList.add('visible');
                            }
                        }
                    }, 500);
                }
            } else if (scrollY <= 100 && scrolled) {
                scrolled = false;
                if (initialView) {
                    initialView.style.display = 'flex';
                    initialView.style.transition = 'opacity 0.3s ease-out';
                    initialView.style.opacity = '1';
                    if (scrollHint) {
                        scrollHint.style.opacity = '1';
                    }
                    if (scrollErrorCode) {
                        scrollErrorCode.classList.remove('visible');
                    }
                }
            }
        }, 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        if (Math.abs(touchY - touchStartY) > 50) {
            handleScroll();
        }
    }, { passive: true });
});

function goBack() {
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.history.back();
    }, 500);
}

function stayHere() {
    const actionArea = document.querySelector('.action-area');
    const buttons = document.querySelector('.buttons');
    const choiceText = document.querySelector('.choice-text');
    buttons.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    buttons.style.opacity = '0';
    buttons.style.transform = 'translateY(20px)';
    if (choiceText) {
        choiceText.style.transition = 'opacity 0.5s ease-out';
        choiceText.style.opacity = '0';
    }
    setTimeout(() => {
        buttons.style.display = 'none';
        if (choiceText) {
            choiceText.style.display = 'none';
        }
        const newMessage = document.createElement('div');
        newMessage.className = 'stay-message';
        newMessage.style.cssText = `
            margin-top: 40px;
            padding: 30px;
            text-align: center;
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1),
                        transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        newMessage.innerHTML = `
            <p style="color: #ff0033; font-weight: 700; margin-bottom: 20px; font-size: clamp(20px, 3vw, 28px);">
                Really? You're choosing to stay gone?
            </p>
            <p style="margin-bottom: 15px; font-size: clamp(16px, 2.5vw, 20px); opacity: 0.9;">
                Even after reading all of this?
            </p>
            <p style="font-weight: 600; margin-bottom: 15px; font-size: clamp(16px, 2.5vw, 20px);">
                You know what? That's your choice.
            </p>
            <p style="margin-top: 30px; opacity: 0.7; font-size: clamp(14px, 2vw, 18px); font-style: italic;">
                But remember: 410 doesn't have to be permanent.
            </p>
            <p style="margin-top: 40px; opacity: 0.6; font-size: clamp(12px, 1.5vw, 16px);">
                The door is always open. When you're ready.
            </p>
        `;
        actionArea.appendChild(newMessage);
        setTimeout(() => {
            newMessage.style.opacity = '1';
            newMessage.style.transform = 'translateY(0)';
        }, 100);
        setTimeout(() => {
            newMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
    }, 500);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        goBack();
    }
    if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        location.reload();
    }
});

let cursorTrail = [];
const maxTrailLength = 15;
let lastMouseX = 0;
let lastMouseY = 0;

const updateCursorTrail = (e) => {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-trail';

    const distance = Math.sqrt(
        Math.pow(e.clientX - lastMouseX, 2) +
        Math.pow(e.clientY - lastMouseY, 2)
    );
    const size = Math.min(6, Math.max(3, distance * 0.08));
    const opacity = Math.min(0.7, Math.max(0.3, distance * 0.012));
    cursor.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, rgba(150, 200, 255, ${opacity}) 0%, rgba(150, 200, 255, ${opacity * 0.4}) 50%, transparent 100%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 ${size * 2}px rgba(150, 200, 255, ${opacity * 0.6});
    `;
    document.body.appendChild(cursor);
    cursorTrail.push(cursor);
    if (cursorTrail.length > maxTrailLength) {
        const oldCursor = cursorTrail.shift();
        oldCursor.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
        oldCursor.style.opacity = '0';
        oldCursor.style.transform = 'translate(-50%, -50%) scale(0.3)';
        setTimeout(() => oldCursor.remove(), 400);
    } else {
        setTimeout(() => {
            cursor.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            cursor.style.opacity = '0';
            cursor.style.transform = 'translate(-50%, -50%) scale(0.2)';
            setTimeout(() => cursor.remove(), 500);
        }, 100);
    }
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
};

let rafId = null;
document.addEventListener('mousemove', (e) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
        updateCursorTrail(e);
        rafId = null;
    });
});

document.addEventListener('mouseleave', () => {
    cursorTrail.forEach(cursor => {
        cursor.style.transition = 'opacity 0.3s ease-out';
        cursor.style.opacity = '0';
        setTimeout(() => cursor.remove(), 300);
    });
    cursorTrail = [];
});

window.addEventListener('beforeunload', (e) => {
});
