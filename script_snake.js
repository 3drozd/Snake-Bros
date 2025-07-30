/**
 * 2-Player Snake Game
 * Modern implementation with smooth animations and clean design
 */

class TwoPlayerSnake {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameStarted = false;
        this.gameOverTimeout = null;
        
        // Round system
        this.currentRound = 1;
        this.maxRounds = 10;
        this.totalScores = {
            1: 0,
            2: 0
        };
        
        // Victory particles
        this.victoryParticles = [];
        this.showVictoryParticles = false;
        
        // Grid settings
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // Game speed (milliseconds between moves) - Balanced for good gameplay
        this.gameSpeed = 120;
        this.lastMoveTime = 0;
        
        // Animation properties for smooth movement
        this.animationProgress = 0;
        this.lastUpdateTime = 0;
        
        // Players setup
        this.players = {
            1: {
                snake: [{ x: 8, y: 15 }, { x: 7, y: 15 }],
                direction: { x: 1, y: 0 },
                nextDirection: { x: 1, y: 0 },
                color: '#00ff41',
                apple: { x: 5, y: 5 },
                appleColor: '#00ff88',
                score: 0,
                alive: true,
                applesEaten: 0,
                speedBoost: false,
                speedBoostEndTime: 0,
                segmentAnimations: []
            },
            2: {
                snake: [{ x: 22, y: 15 }, { x: 23, y: 15 }],
                direction: { x: -1, y: 0 },
                nextDirection: { x: -1, y: 0 },
                color: '#00d4ff',
                apple: { x: 25, y: 25 },
                appleColor: '#4dc8ff',
                score: 0,
                alive: true,
                applesEaten: 0,
                speedBoost: false,
                speedBoostEndTime: 0,
                segmentAnimations: []
            }
        };
        
        // Super Apple mechanics
        this.superApple = {
            active: false,
            x: 0,
            y: 0,
            triggerCount: 5, // Appears after 5 apples eaten
            glowPhase: 0 // For animation
        };
        
        // DOM elements
        this.elements = {
            player1Score: document.getElementById('player1Score'),
            player2Score: document.getElementById('player2Score'),
            player1TotalPanel: document.getElementById('player1TotalPanel'),
            player2TotalPanel: document.getElementById('player2TotalPanel'),
            gameMessage: document.getElementById('gameMessage'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            gameResult: document.getElementById('gameResult'),
            finalScore1: document.getElementById('finalScore1'),
            finalScore2: document.getElementById('finalScore2'),
            pauseBtn: document.getElementById('pauseBtn'),
            restartBtn: document.getElementById('restartBtn'),
            playAgainBtn: document.getElementById('playAgainBtn'),
            roundCounter: document.getElementById('roundCounter')
        };
        
        // Audio context for sound effects
        this.initAudio();
        
        // Initialize game
        this.setupEventListeners();
        this.generateApples();
        this.render();
        
        // Start animation loop
        this.animationLoop();
    }
    
    /**
     * Initialize Web Audio API for sound effects
     */
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.audioContext = null;
        }
    }
    
    /**
     * Play eat sound effect
     */
    playEatSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(783.99, this.audioContext.currentTime + 0.1); // G5
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    /**
     * Play crash sound effect
     */
    playCrashSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    /**
     * Play segment loss sound effect
     */
    playSegmentLossSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.15); // A3
        
        gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }
    
    /**
     * Play victory sound effect for winning the entire game
     */
    playVictorySound() {
        if (!this.audioContext) return;
        
        // Create a triumphant ascending melody
        const notes = [
            { freq: 523.25, time: 0, duration: 0.3 },    // C5
            { freq: 587.33, time: 0.15, duration: 0.3 }, // D5
            { freq: 659.25, time: 0.3, duration: 0.3 },  // E5
            { freq: 698.46, time: 0.45, duration: 0.3 }, // F5
            { freq: 783.99, time: 0.6, duration: 0.6 }   // G5 (longer)
        ];
        
        notes.forEach(note => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime + note.time);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + note.time);
            gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + note.time + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.time + note.duration);
            
            oscillator.start(this.audioContext.currentTime + note.time);
            oscillator.stop(this.audioContext.currentTime + note.time + note.duration);
        });
    }
    
    /**
     * Setup event listeners for controls
     */
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Button controls
        this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        this.elements.restartBtn.addEventListener('click', () => this.restart());
        this.elements.playAgainBtn.addEventListener('click', () => {
            if (this.currentRound >= this.maxRounds) {
                this.restart(); // Complete restart
            } else {
                this.nextRound(); // Next round
            }
        });
        
        // Prevent arrow keys from scrolling the page
        window.addEventListener('keydown', (e) => {
            if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code) > -1) {
                e.preventDefault();
            }
        }, false);
    }
    
    /**
     * Handle keyboard input
     */
    handleKeyPress(e) {
        const key = e.key.toLowerCase();
        
        // Start game with spacebar
        if (key === ' ' && !this.gameStarted) {
            this.startGame();
            return;
        }
        
        // Restart game with spacebar when game is over
        if (key === ' ' && this.gameStarted && !this.gameRunning) {
            // Check if this is the final round
            if (this.currentRound >= this.maxRounds) {
                this.restart(); // Complete restart
            } else {
                this.nextRound(); // Next round
            }
            return;
        }
        
        // Pause/unpause with spacebar during game
        if (key === ' ' && this.gameStarted && this.gameRunning) {
            this.togglePause();
            return;
        }
        
        if (!this.gameRunning || this.gamePaused) return;
        
        // Player 1 controls (WASD) - Instant direction change
        switch (key) {
            case 'w':
                if (this.players[1].direction.y !== 1 && !this.wouldTurnIntoHead(1, { x: 0, y: -1 })) {
                    this.players[1].direction = { x: 0, y: -1 };
                    this.players[1].nextDirection = { x: 0, y: -1 };
                }
                break;
            case 's':
                if (this.players[1].direction.y !== -1 && !this.wouldTurnIntoHead(1, { x: 0, y: 1 })) {
                    this.players[1].direction = { x: 0, y: 1 };
                    this.players[1].nextDirection = { x: 0, y: 1 };
                }
                break;
            case 'a':
                if (this.players[1].direction.x !== 1 && !this.wouldTurnIntoHead(1, { x: -1, y: 0 })) {
                    this.players[1].direction = { x: -1, y: 0 };
                    this.players[1].nextDirection = { x: -1, y: 0 };
                }
                break;
            case 'd':
                if (this.players[1].direction.x !== -1 && !this.wouldTurnIntoHead(1, { x: 1, y: 0 })) {
                    this.players[1].direction = { x: 1, y: 0 };
                    this.players[1].nextDirection = { x: 1, y: 0 };
                }
                break;
        }
        
        // Player 2 controls (Arrow keys) - Instant direction change
        switch (e.key) {
            case 'ArrowUp':
                if (this.players[2].direction.y !== 1 && !this.wouldTurnIntoHead(2, { x: 0, y: -1 })) {
                    this.players[2].direction = { x: 0, y: -1 };
                    this.players[2].nextDirection = { x: 0, y: -1 };
                }
                break;
            case 'ArrowDown':
                if (this.players[2].direction.y !== -1 && !this.wouldTurnIntoHead(2, { x: 0, y: 1 })) {
                    this.players[2].direction = { x: 0, y: 1 };
                    this.players[2].nextDirection = { x: 0, y: 1 };
                }
                break;
            case 'ArrowLeft':
                if (this.players[2].direction.x !== 1 && !this.wouldTurnIntoHead(2, { x: -1, y: 0 })) {
                    this.players[2].direction = { x: -1, y: 0 };
                    this.players[2].nextDirection = { x: -1, y: 0 };
                }
                break;
            case 'ArrowRight':
                if (this.players[2].direction.x !== -1 && !this.wouldTurnIntoHead(2, { x: 1, y: 0 })) {
                    this.players[2].direction = { x: 1, y: 0 };
                    this.players[2].nextDirection = { x: 1, y: 0 };
                }
                break;
        }
    }
    
    /**
     * Start the game
     */
    startGame() {
        this.gameRunning = true;
        this.gameStarted = true;
        this.gamePaused = false;
        this.elements.gameMessage.textContent = 'Game Started!';
        setTimeout(() => {
            if (this.gameRunning && !this.gamePaused) {
                this.elements.gameMessage.classList.add('game-started');
            }
        }, 300);
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        if (!this.gameStarted) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            this.elements.gameMessage.textContent = 'Paused - Press SPACE to Resume';
            this.elements.gameMessage.classList.remove('game-started');
            this.elements.pauseBtn.textContent = 'Resume';
        } else {
            this.elements.gameMessage.classList.add('game-started');
            this.elements.pauseBtn.textContent = 'Pause';
        }
    }
    
    /**
     * Start next round
     */
    nextRound() {
        // Add current round scores to total
        this.totalScores[1] += this.players[1].score;
        this.totalScores[2] += this.players[2].score;
        
        // Update total scores display
        this.updateTotalScores();
        
        // Move to next round
        this.currentRound++;
        this.updateRoundDisplay();
        
        // Reset for next round
        this.resetRound();
    }
    
    /**
     * Reset current round
     */
    resetRound() {
        // Clear any pending game over screen timeout
        if (this.gameOverTimeout) {
            clearTimeout(this.gameOverTimeout);
            this.gameOverTimeout = null;
        }
        
        // Reset game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameStarted = false;
        
        // Reset players
        this.players[1] = {
            snake: [{ x: 8, y: 15 }, { x: 7, y: 15 }],
            direction: { x: 1, y: 0 },
            nextDirection: { x: 1, y: 0 },
            color: '#00ff41',
            apple: { x: 5, y: 5 },
            appleColor: '#00ff88',
            score: 0,
            alive: true,
            applesEaten: 0,
            speedBoost: false,
            speedBoostEndTime: 0,
            segmentAnimations: []
        };
        
        this.players[2] = {
            snake: [{ x: 22, y: 15 }, { x: 23, y: 15 }],
            direction: { x: -1, y: 0 },
            nextDirection: { x: -1, y: 0 },
            color: '#00d4ff',
            apple: { x: 25, y: 25 },
            appleColor: '#4dc8ff',
            score: 0,
            alive: true,
            applesEaten: 0,
            speedBoost: false,
            speedBoostEndTime: 0,
            segmentAnimations: []
        };
        
        // Reset Super Apple
        this.superApple = {
            active: false,
            x: 0,
            y: 0,
            triggerCount: 5,
            glowPhase: 0
        };
        
        // Reset animation
        this.animationProgress = 0;
        this.lastUpdateTime = 0;
        
        // Reset UI
        this.elements.player1Score.textContent = '0';
        this.elements.player2Score.textContent = '0';
        this.elements.gameMessage.textContent = 'Press SPACE to Start';
        this.elements.gameMessage.classList.remove('game-started');
        this.elements.pauseBtn.textContent = 'Pause';
        this.elements.gameOverScreen.classList.add('hidden');
        
        // Generate new apples
        this.generateApples();
        this.render();
    }
    
    /**
     * Complete restart (reset everything including rounds)
     */
    restart() {
        // Reset round system
        this.currentRound = 1;
        this.totalScores[1] = 0;
        this.totalScores[2] = 0;
        this.updateRoundDisplay();
        this.updateTotalScores();
        
        // Clear victory effects
        this.showVictoryParticles = false;
        this.victoryParticles = [];
        
        // Reset current round
        this.resetRound();
    }
    
    /**
     * Update round display
     */
    updateRoundDisplay() {
        this.elements.roundCounter.textContent = this.currentRound;
    }
    
    /**
     * Create victory particles
     */
    createVictoryParticles() {
        this.victoryParticles = [];
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            this.victoryParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 4 + 2,
                color: `hsl(${Math.random() * 60 + 30}, 100%, ${Math.random() * 20 + 60}%)`, // Gold hues
                life: 1,
                decay: Math.random() * 0.02 + 0.01
            });
        }
        
        this.showVictoryParticles = true;
        
        // Stop particles after 5 seconds
        setTimeout(() => {
            this.showVictoryParticles = false;
        }, 5000);
    }
    
    /**
     * Update victory particles
     */
    updateVictoryParticles() {
        if (!this.showVictoryParticles) return;
        
        this.victoryParticles = this.victoryParticles.filter(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Update life
            particle.life -= particle.decay;
            
            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.vx *= -0.8;
                particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.vy *= -0.8;
                particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            }
            
            // Add gravity
            particle.vy += 0.1;
            
            return particle.life > 0;
        });
    }
    
    /**
     * Draw victory particles
     */
    drawVictoryParticles() {
        if (!this.showVictoryParticles) return;
        
        this.victoryParticles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = particle.color;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add sparkle effect
            if (Math.random() < 0.3) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }
    
    /**
     * Generate apples for both players
     */
    generateApples() {
        this.generateApple(1);
        this.generateApple(2);
    }
    
    /**
     * Generate apple for specific player
     */
    generateApple(playerNum) {
        const player = this.players[playerNum];
        const otherPlayer = this.players[playerNum === 1 ? 2 : 1];
        
        let newApple;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            newApple = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            attempts++;
        } while (
            attempts < maxAttempts && (
                this.isPositionOccupied(newApple, player.snake) ||
                this.isPositionOccupied(newApple, otherPlayer.snake) ||
                (newApple.x === otherPlayer.apple.x && newApple.y === otherPlayer.apple.y) ||
                (this.superApple.active && newApple.x === this.superApple.x && newApple.y === this.superApple.y)
            )
        );
        
        player.apple = newApple;
    }
    
    /**
     * Check if position is occupied by snake
     */
    isPositionOccupied(pos, snake) {
        return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
    }
    
    /**
     * Reset animation progress for smooth instant turns
     */
    resetAnimationProgress() {
        // Don't reset animation progress - let it continue smoothly
        // This prevents the lag when turning
        const currentTime = Date.now();
        this.lastUpdateTime = currentTime;
        // Keep current animation progress to maintain smooth movement
    }
    
    /**
     * Generate Super Apple when conditions are met
     */
    generateSuperApple() {
        if (this.superApple.active) return;
        
        let newSuperApple;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            newSuperApple = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            attempts++;
        } while (
            attempts < maxAttempts && (
                this.isPositionOccupied(newSuperApple, this.players[1].snake) ||
                this.isPositionOccupied(newSuperApple, this.players[2].snake) ||
                (newSuperApple.x === this.players[1].apple.x && newSuperApple.y === this.players[1].apple.y) ||
                (newSuperApple.x === this.players[2].apple.x && newSuperApple.y === this.players[2].apple.y)
            )
        );
        
        this.superApple.x = newSuperApple.x;
        this.superApple.y = newSuperApple.y;
        this.superApple.active = true;
        this.superApple.glowPhase = 0;
    }

    /**
     * Add segment animation for a player
     */
    addSegmentAnimation(playerNum, type, position) {
        const player = this.players[playerNum];
        const animation = {
            type: type, // 'gain' or 'loss'
            x: position.x,
            y: position.y,
            startTime: Date.now(),
            duration: 300, // 300ms animation
            scale: type === 'gain' ? 0 : 1,
            opacity: 1,
            color: player.color
        };
        
        player.segmentAnimations.push(animation);
    }
    
    /**
     * Update segment animations
     */
    updateSegmentAnimations(currentTime) {
        for (let playerNum of [1, 2]) {
            const player = this.players[playerNum];
            
            // Update and filter animations
            player.segmentAnimations = player.segmentAnimations.filter(animation => {
                const elapsed = currentTime - animation.startTime;
                const progress = Math.min(1, Math.max(0, elapsed / animation.duration));
                
                if (animation.type === 'gain') {
                    // Pop in animation
                    animation.scale = Math.max(0, this.easeOutBack(progress));
                    animation.opacity = 1;
                } else if (animation.type === 'loss') {
                    // Pop out animation
                    animation.scale = Math.max(0, 1 - this.easeInBack(progress));
                    animation.opacity = Math.max(0, 1 - progress);
                }
                
                // Ensure values are valid numbers
                if (isNaN(animation.scale) || !isFinite(animation.scale)) {
                    animation.scale = progress === 0 ? 0 : 1;
                }
                if (isNaN(animation.opacity) || !isFinite(animation.opacity)) {
                    animation.opacity = 1;
                }
                
                // Remove animation if completed
                return progress < 1;
            });
        }
    }
    
    /**
     * Easing function for pop-in effect
     */
    easeOutBack(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    
    /**
     * Easing function for pop-out effect
     */
    easeInBack(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    }

    /**
     * Add segment animation for a player
     */
    addSegmentAnimation(playerNum, type, position) {
        const player = this.players[playerNum];
        const animation = {
            type: type, // 'gain' or 'loss'
            x: position.x,
            y: position.y,
            startTime: Date.now(),
            duration: 300, // 300ms animation
            scale: type === 'gain' ? 0 : 1,
            opacity: 1,
            color: player.color
        };
        
        player.segmentAnimations.push(animation);
    }
    
    /**
     * Update segment animations
     */
    updateSegmentAnimations(currentTime) {
        for (let playerNum of [1, 2]) {
            const player = this.players[playerNum];
            
            // Update and filter animations
            player.segmentAnimations = player.segmentAnimations.filter(animation => {
                const elapsed = currentTime - animation.startTime;
                const progress = Math.min(1, Math.max(0, elapsed / animation.duration));
                
                if (animation.type === 'gain') {
                    // Pop in animation
                    animation.scale = Math.max(0, this.easeOutBack(progress));
                    animation.opacity = 1;
                } else if (animation.type === 'loss') {
                    // Pop out animation
                    animation.scale = Math.max(0, 1 - this.easeInBack(progress));
                    animation.opacity = Math.max(0, 1 - progress);
                }
                
                // Ensure values are valid numbers
                if (isNaN(animation.scale) || !isFinite(animation.scale)) {
                    animation.scale = progress === 0 ? 0 : 1;
                }
                if (isNaN(animation.opacity) || !isFinite(animation.opacity)) {
                    animation.opacity = 1;
                }
                
                // Remove animation if completed
                return progress < 1;
            });
        }
    }
    
    /**
     * Easing function for pop-in effect
     */
    easeOutBack(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    
    /**
     * Easing function for pop-out effect
     */
    easeInBack(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    }
    
    /**
     * Main animation loop using requestAnimationFrame
     */
    animationLoop() {
        const currentTime = Date.now();
        
        if (this.gameRunning && !this.gamePaused) {
            // Check and update speed boosts
            this.updateSpeedBoosts(currentTime);
            
            // Use dynamic speed based on fastest player
            const currentGameSpeed = this.getCurrentGameSpeed();
            
            if (currentTime - this.lastMoveTime >= currentGameSpeed) {
                this.update();
                this.lastMoveTime = currentTime;
                this.animationProgress = 0;
                this.lastUpdateTime = currentTime;
            } else {
                // Calculate smooth animation progress
                this.animationProgress = Math.min(1, (currentTime - this.lastUpdateTime) / currentGameSpeed);
            }
        }
        
        // Update super apple glow animation (optimized for smooth performance)
        if (this.superApple.active) {
            this.superApple.glowPhase += 0.08;
        }
        
        // Update segment animations
        this.updateSegmentAnimations(currentTime);
        
        // Update victory particles
        this.updateVictoryParticles();
        
        this.render();
        requestAnimationFrame(() => this.animationLoop());
    }
    
    /**
     * Update game logic
     */
    update() {
        // Calculate next head positions for both players
        const player1 = this.players[1];
        const player2 = this.players[2];
        
        const nextHead1 = {
            x: player1.snake[0].x + player1.direction.x,
            y: player1.snake[0].y + player1.direction.y
        };
        
        const nextHead2 = {
            x: player2.snake[0].x + player2.direction.x,
            y: player2.snake[0].y + player2.direction.y
        };
        
        // Check for head-to-head collision first
        if (player1.alive && player2.alive && 
            nextHead1.x === nextHead2.x && nextHead1.y === nextHead2.y) {
            // Head-to-head collision - 50/50 chance
            const randomWinner = Math.random() < 0.5;
            if (randomWinner) {
                player2.alive = false; // Player 1 wins
            } else {
                player1.alive = false; // Player 2 wins
            }
            this.playCrashSound();
        }
        
        // Update both players
        for (let playerNum of [1, 2]) {
            const player = this.players[playerNum];
            if (!player.alive) continue;
            
            // Direction is already updated instantly on key press
            // player.direction = { ...player.nextDirection };
            
            // Calculate new head position
            const head = {
                x: player.snake[0].x + player.direction.x,
                y: player.snake[0].y + player.direction.y
            };
            
            // Check wall collision
            if (this.checkWallCollision(head)) {
                player.alive = false;
                this.playCrashSound();
                continue;
            }
            
            // Check self collision
            if (this.checkSelfCollision(head, player.snake)) {
                player.alive = false;
                this.playCrashSound();
                continue;
            }
            
            // Check collision with other player
            const otherPlayer = this.players[playerNum === 1 ? 2 : 1];
            if (this.checkCollisionWithOtherSnake(head, otherPlayer.snake)) {
                // Regular collision - this player loses
                player.alive = false;
                this.playCrashSound();
                continue;
            }
            
            // Add new head
            player.snake.unshift(head);
            
            // Check apple collisions (own apple)
            let ateApple = false;
            if (head.x === player.apple.x && head.y === player.apple.y) {
                player.score += 10;
                player.applesEaten++;
                this.updateScore(playerNum);
                this.generateApple(playerNum);
                this.playEatSound();
                
                // Add segment gain animation at the tail position
                const tail = player.snake[player.snake.length - 1];
                this.addSegmentAnimation(playerNum, 'gain', { x: tail.x, y: tail.y });
                
                ateApple = true;
                
                // Check if Super Apple should spawn
                if (player.applesEaten % this.superApple.triggerCount === 0) {
                    this.generateSuperApple();
                }
            }
            
            // Check collision with other player's apple (apple stealing)
            const otherPlayerNum = playerNum === 1 ? 2 : 1;
            const otherPlayerApple = this.players[otherPlayerNum].apple;
            if (head.x === otherPlayerApple.x && head.y === otherPlayerApple.y) {
                const otherPlayer = this.players[otherPlayerNum];
                
                // Opponent loses 10 points (minimum 0)
                otherPlayer.score = Math.max(0, otherPlayer.score - 10);
                this.updateScore(otherPlayerNum);
                
                // If opponent has only head, they lose the game
                if (otherPlayer.snake.length === 1) {
                    otherPlayer.alive = false;
                    this.playCrashSound();
                } else {
                    // Get tail position before removing it for animation
                    const tailPosition = { ...otherPlayer.snake[otherPlayer.snake.length - 1] };
                    
                    // Remove one segment from opponent's tail
                    otherPlayer.snake.pop();
                    
                    // Add segment loss animation at the tail position
                    this.addSegmentAnimation(otherPlayerNum, 'loss', tailPosition);
                    
                    // Play segment loss sound
                    this.playSegmentLossSound();
                }
                
                this.generateApple(otherPlayerNum); // Generate new apple for the other player
                this.playEatSound();
                ateApple = true;
            }
            
            // Check Super Apple collision
            if (this.superApple.active && head.x === this.superApple.x && head.y === this.superApple.y) {
                player.score += 30; // 3 points worth 10 each
                player.applesEaten += 3;
                this.updateScore(playerNum);
                this.superApple.active = false;
                this.playEatSound();
                
                // Activate speed boost for 5 seconds
                player.speedBoost = true;
                player.speedBoostEndTime = Date.now() + 5000; // 5 seconds
                
                // Get tail position for animations
                const tail = player.snake[player.snake.length - 1];
                
                // Grow snake by 3 segments (add 2 extra, as one is already added by not removing tail)
                for (let i = 0; i < 2; i++) {
                    player.snake.push({ x: tail.x, y: tail.y });
                }
                
                // Add multiple segment gain animations
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        this.addSegmentAnimation(playerNum, 'gain', { x: tail.x, y: tail.y });
                    }, i * 100); // Stagger animations by 100ms
                }
                
                ateApple = true;
            }
            
            if (!ateApple) {
                // Remove tail (snake doesn't grow)
                player.snake.pop();
            }
        }
        
        // Check game over conditions
        if (!this.players[1].alive || !this.players[2].alive) {
            this.gameOver();
        }
    }
    
    /**
     * Check wall collision
     */
    checkWallCollision(pos) {
        return pos.x < 0 || pos.x >= this.tileCount || pos.y < 0 || pos.y >= this.tileCount;
    }
    
    /**
     * Check self collision
     */
    checkSelfCollision(head, snake) {
        // Skip the first 2 segments (head and first body segment) to prevent immediate collision
        return snake.slice(2).some(segment => segment.x === head.x && segment.y === head.y);
    }
    
    /**
     * Check collision with other snake
     */
    checkCollisionWithOtherSnake(head, otherSnake) {
        return otherSnake.some(segment => segment.x === head.x && segment.y === head.y);
    }
    
    /**
     * Check if turning in the given direction would place the snake at its first 2 segments
     */
    wouldTurnIntoHead(playerNum, newDirection) {
        const player = this.players[playerNum];
        const head = player.snake[0];
        
        // Calculate where the head would be with the new direction
        const newHeadPos = {
            x: head.x + newDirection.x,
            y: head.y + newDirection.y
        };
        
        // Check if this position matches any of the first 2 segments
        const firstTwoSegments = player.snake.slice(0, 2);
        return firstTwoSegments.some(segment => 
            newHeadPos.x === segment.x && newHeadPos.y === segment.y
        );
    }
    
    /**
     * Update score display
     */
    updateScore(playerNum) {
        const scoreElement = playerNum === 1 ? this.elements.player1Score : this.elements.player2Score;
        scoreElement.textContent = this.players[playerNum].score;
        
        // Add animation class
        scoreElement.classList.add('grow-animation');
        setTimeout(() => scoreElement.classList.remove('grow-animation'), 200);
    }
    
    /**
     * Update total score display
     */
    updateTotalScores() {
        this.elements.player1TotalPanel.textContent = this.totalScores[1];
        this.elements.player2TotalPanel.textContent = this.totalScores[2];
    }
    
    /**
     * Handle game over
     */
    gameOver() {
        this.gameRunning = false;
        
        // Determine winner and add bonus points
        const p1Alive = this.players[1].alive;
        const p2Alive = this.players[2].alive;
        let p1Score = this.players[1].score;
        let p2Score = this.players[2].score;
        
        let resultMessage;
        let winnerBonus = 50; // Bonus points for winning
        
        if (!p1Alive && !p2Alive) {
            if (p1Score === p2Score) {
                resultMessage = "Round Draw!";
                // No bonus for draws
            } else if (p1Score > p2Score) {
                p1Score += winnerBonus;
                this.players[1].score = p1Score;
                this.updateScore(1);
                resultMessage = "Player 1 Wins Round! +50";
            } else {
                p2Score += winnerBonus;
                this.players[2].score = p2Score;
                this.updateScore(2);
                resultMessage = "Player 2 Wins Round! +50";
            }
        } else if (p1Alive && !p2Alive) {
            p1Score += winnerBonus;
            this.players[1].score = p1Score;
            this.updateScore(1);
            resultMessage = "Player 1 Wins Round! +50";
        } else if (!p1Alive && p2Alive) {
            p2Score += winnerBonus;
            this.players[2].score = p2Score;
            this.updateScore(2);
            resultMessage = "Player 2 Wins Round! +50";
        }
        
        // Check if this is the final round
        const isFinalRound = this.currentRound >= this.maxRounds;
        
        if (isFinalRound) {
            // Calculate final total scores
            const finalTotal1 = this.totalScores[1] + p1Score;
            const finalTotal2 = this.totalScores[2] + p2Score;
            
            let isGameWin = false;
            if (finalTotal1 === finalTotal2) {
                resultMessage = "Final Draw!";
            } else if (finalTotal1 > finalTotal2) {
                resultMessage = "Player 1 Wins Game!";
                isGameWin = true;
            } else {
                resultMessage = "Player 2 Wins Game!";
                isGameWin = true;
            }
            
            // Trigger victory effects for game win
            if (isGameWin) {
                this.playVictorySound();
                this.createVictoryParticles();
            }
            
            this.elements.finalScore1.textContent = finalTotal1;
            this.elements.finalScore2.textContent = finalTotal2;
            this.elements.gameMessage.textContent = 'Game Complete - Press SPACE to Restart';
            this.elements.playAgainBtn.textContent = 'Play Again';
        } else {
            this.elements.finalScore1.textContent = p1Score;
            this.elements.finalScore2.textContent = p2Score;
            this.elements.gameMessage.textContent = 'Round Over - Press SPACE for Next Round';
            this.elements.playAgainBtn.textContent = 'Next Round';
        }
        
        // Update game over screen
        this.elements.gameResult.textContent = resultMessage;
        
        // Add victory styling for final game wins
        if (isFinalRound && (resultMessage.includes("Wins Game!"))) {
            this.elements.gameResult.classList.add('victory');
        } else {
            this.elements.gameResult.classList.remove('victory');
        }
        
        // Show game over screen with animation
        this.gameOverTimeout = setTimeout(() => {
            // Only show if game is still over (not restarted)
            if (!this.gameRunning && this.gameStarted) {
                this.elements.gameOverScreen.classList.remove('hidden');
                this.elements.gameOverScreen.classList.add('fade-in');
            }
            this.gameOverTimeout = null;
        }, 500);
    }
    
    /**
     * Render the game
     */
    render() {
        // Clear canvas with darker background for better contrast
        this.ctx.fillStyle = '#0f1419';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (more visible for better navigation)
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            const pos = i * this.gridSize;
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }
        
        // Draw players
        for (let playerNum of [1, 2]) {
            const player = this.players[playerNum];
            
            // Draw snake with smooth animation
            this.drawSnake(player.snake, player.color, player.alive, playerNum);
            
            // Draw apple
            this.drawApple(player.apple, player.appleColor);
        }
        
        // Draw Super Apple if active
        if (this.superApple.active) {
            this.drawSuperApple();
        }
        
        // Draw segment animations
        this.drawSegmentAnimations();
        
        // Draw victory particles
        this.drawVictoryParticles();
    }
    
    /**
     * Draw snake with smooth rounded segments and interpolated movement
     */
    drawSnake(snake, color, alive, playerNum) {
        this.ctx.fillStyle = alive ? color : '#7f8c8d';
        this.ctx.shadowBlur = alive ? 10 : 0;
        this.ctx.shadowColor = color;
        
        snake.forEach((segment, index) => {
            let x = segment.x * this.gridSize;
            let y = segment.y * this.gridSize;
            
            // Apply smooth animation to all segments for fluid following motion
            if (alive && this.gameRunning && !this.gamePaused) {
                const player = this.players[playerNum];
                
                if (index === 0) {
                    // Head moves in current direction
                    const interpolationX = player.direction.x * this.gridSize * this.animationProgress;
                    const interpolationY = player.direction.y * this.gridSize * this.animationProgress;
                    x += interpolationX;
                    y += interpolationY;
                } else {
                    // Body segments follow the segment in front of them
                    const prevSegment = snake[index - 1];
                    const currentSegment = snake[index];
                    
                    // Calculate direction from current segment to previous segment
                    const followDirX = prevSegment.x - currentSegment.x;
                    const followDirY = prevSegment.y - currentSegment.y;
                    
                    // Only interpolate if there's actual movement (not diagonal)
                    if (Math.abs(followDirX) + Math.abs(followDirY) === 1) {
                        const interpolationX = followDirX * this.gridSize * this.animationProgress;
                        const interpolationY = followDirY * this.gridSize * this.animationProgress;
                        x += interpolationX;
                        y += interpolationY;
                    }
                }
            }
            
            // Draw head as square, body as rounded rectangles
            if (index === 0) {
                this.ctx.globalAlpha = alive ? 1 : 0.5;
                const player = this.players[playerNum];
                this.drawSquareHead(x, y, alive ? color : '#7f8c8d', player.speedBoost);
            } else {
                this.ctx.globalAlpha = alive ? 0.9 - (index * 0.05) : 0.3;
                this.drawRoundedRect(x + 2, y + 2, this.gridSize - 4, this.gridSize - 4, 6);
            }
        });
        
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * Draw apple with glow effect
     */
    drawApple(apple, color) {
        const x = apple.x * this.gridSize;
        const y = apple.y * this.gridSize;
        
        this.ctx.fillStyle = color;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = color;
        
        // Draw apple as circle
        this.ctx.beginPath();
        this.ctx.arc(
            x + this.gridSize / 2,
            y + this.gridSize / 2,
            (this.gridSize - 4) / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * Draw Super Apple with special effects
     */
    drawSuperApple() {
        const x = this.superApple.x * this.gridSize;
        const y = this.superApple.y * this.gridSize;
        const centerX = x + this.gridSize / 2;
        const centerY = y + this.gridSize / 2;
        
        // Animated glow effect
        const glowIntensity = 0.7 + 0.3 * Math.sin(this.superApple.glowPhase);
        const glowSize = 25 + 10 * Math.sin(this.superApple.glowPhase * 1.5);
        
        // Outer glow
        this.ctx.shadowBlur = glowSize;
        this.ctx.shadowColor = '#f39c12';
        this.ctx.fillStyle = '#f39c12';
        
        // Draw larger, pulsing super apple
        const radius = (this.gridSize - 2) / 2 + 3 * Math.sin(this.superApple.glowPhase);
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner bright core
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Sparkle effect
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#fff';
        const sparkleSize = 2;
        for (let i = 0; i < 4; i++) {
            const angle = (this.superApple.glowPhase + i * Math.PI / 2) % (Math.PI * 2);
            const sparkleRadius = radius * 0.8;
            const sparkleX = centerX + Math.cos(angle) * sparkleRadius;
            const sparkleY = centerY + Math.sin(angle) * sparkleRadius;
            
            this.ctx.beginPath();
            this.ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * Draw segment animations
     */
    drawSegmentAnimations() {
        try {
            for (let playerNum of [1, 2]) {
                const player = this.players[playerNum];
                
                if (!player.segmentAnimations) continue;
                
                player.segmentAnimations.forEach(animation => {
                    // Validate animation properties
                    if (!animation || typeof animation.x !== 'number' || typeof animation.y !== 'number') {
                        return;
                    }
                    
                    const x = animation.x * this.gridSize;
                    const y = animation.y * this.gridSize;
                    const centerX = x + this.gridSize / 2;
                    const centerY = y + this.gridSize / 2;
                    
                    // Ensure scale and opacity are valid
                    const scale = Math.max(0, Math.min(2, animation.scale || 0));
                    const opacity = Math.max(0, Math.min(1, animation.opacity || 0));
                    
                    if (scale <= 0 || opacity <= 0) return;
                    
                    // Save current context state
                    this.ctx.save();
                    
                    // Set alpha for fade effect
                    this.ctx.globalAlpha = opacity;
                    
                    if (animation.type === 'gain') {
                        // Segment gain animation - growing circle with player color
                        this.ctx.fillStyle = animation.color || '#27ae60';
                        this.ctx.shadowBlur = Math.max(0, 15 * scale);
                        this.ctx.shadowColor = animation.color || '#27ae60';
                        
                        const radius = Math.max(0, (this.gridSize / 2 - 2) * scale);
                        if (radius > 0) {
                            this.ctx.beginPath();
                            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                            this.ctx.fill();
                            
                            // Add inner highlight
                            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                            this.ctx.shadowBlur = 0;
                            const innerRadius = Math.max(0, (this.gridSize / 3) * scale);
                            if (innerRadius > 0) {
                                this.ctx.beginPath();
                                this.ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
                                this.ctx.fill();
                            }
                        }
                        
                    } else if (animation.type === 'loss') {
                        // Segment loss animation - shrinking segment with red tint
                        this.ctx.fillStyle = '#e74c3c';
                        this.ctx.shadowBlur = Math.max(0, 10 * scale);
                        this.ctx.shadowColor = '#e74c3c';
                        
                        // Draw shrinking rounded rectangle
                        const size = Math.max(0, (this.gridSize - 4) * scale);
                        if (size > 0) {
                            const offsetX = (this.gridSize - size) / 2;
                            const offsetY = (this.gridSize - size) / 2;
                            
                            this.drawRoundedRect(x + offsetX, y + offsetY, size, size, Math.max(1, 6 * scale));
                            
                            // Add particle effect
                            for (let i = 0; i < 4; i++) {
                                const angle = (i * Math.PI / 2) + (Date.now() * 0.01);
                                const distance = (1 - scale) * 20;
                                const particleX = centerX + Math.cos(angle) * distance;
                                const particleY = centerY + Math.sin(angle) * distance;
                                
                                this.ctx.fillStyle = '#e74c3c';
                                this.ctx.shadowBlur = 5;
                                const particleRadius = Math.max(0, 2 * scale);
                                if (particleRadius > 0) {
                                    this.ctx.beginPath();
                                    this.ctx.arc(particleX, particleY, particleRadius, 0, Math.PI * 2);
                                    this.ctx.fill();
                                }
                            }
                        }
                    }
                    
                    // Restore context state
                    this.ctx.restore();
                });
            }
        } catch (error) {
            console.warn('Error drawing segment animations:', error);
            // Clear all animations if there's an error
            for (let playerNum of [1, 2]) {
                if (this.players[playerNum]) {
                    this.players[playerNum].segmentAnimations = [];
                }
            }
        }
    }
    
    /**
     * Update speed boosts and check for expiration
     */
    updateSpeedBoosts(currentTime) {
        for (let playerNum of [1, 2]) {
            const player = this.players[playerNum];
            if (player.speedBoost && currentTime >= player.speedBoostEndTime) {
                player.speedBoost = false;
                player.speedBoostEndTime = 0;
            }
        }
    }
    
    /**
     * Get current game speed (faster if any player has speed boost)
     */
    getCurrentGameSpeed() {
        const hasSpeedBoost = this.players[1].speedBoost || this.players[2].speedBoost;
        return hasSpeedBoost ? this.gameSpeed * 0.6 : this.gameSpeed; // 40% faster when boosted
    }
    
    /**
     * Draw square head with optional glow effect
     */
    drawSquareHead(x, y, color, hasSpeedBoost) {
        // Add glow effect if player has speed boost
        if (hasSpeedBoost) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = color;
        }
        
        this.ctx.fillStyle = color;
        
        // Draw square head that fills most of the grid cell
        this.drawRoundedRect(x + 1, y + 1, this.gridSize - 2, this.gridSize - 2, 3);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * Draw rounded rectangle
     */
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TwoPlayerSnake();
});