// Globe Trotter App - Track Your Running Journey Around the World

class GlobetrotterApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.globe = null;
        this.controls = null;
        this.runningPath = [];
        this.pathLine = null;
        this.marker = null;
        this.animationId = null;
        this.isAnimating = true;
        
        // Running data
        this.totalMiles = 0;
        this.runCount = 0;
        this.currentPosition = { lat: 40.7128, lon: -74.0060 }; // Starting at NYC
        this.EARTH_CIRCUMFERENCE = 24901; // miles
        
        // Cities for realistic running progression
        this.cities = [
            { name: "New York", lat: 40.7128, lon: -74.0060 },
            { name: "London", lat: 51.5074, lon: -0.1278 },
            { name: "Paris", lat: 48.8566, lon: 2.3522 },
            { name: "Moscow", lat: 55.7558, lon: 37.6173 },
            { name: "Beijing", lat: 39.9042, lon: 116.4074 },
            { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
            { name: "Sydney", lat: -33.8688, lon: 151.2093 },
            { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
            { name: "Chicago", lat: 41.8781, lon: -87.6298 },
            { name: "Miami", lat: 25.7617, lon: -80.1918 }
        ];
        
        this.init();
    }
    
    init() {
        this.initScene();
        this.createGlobe();
        this.createLighting();
        this.setupControls();
        this.createMarker();
        this.animate();
        this.updateUI();
    }
    
    initScene() {
        const container = document.getElementById('canvas-container');
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050520);
        
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.z = 3;
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);
        
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createGlobe() {
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        
        // Create earth texture using canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Create gradient for earth
        const gradient = context.createLinearGradient(0, 0, 1024, 512);
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(0.3, '#2e7d32');
        gradient.addColorStop(0.6, '#1565c0');
        gradient.addColorStop(1, '#1e3c72');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 1024, 512);
        
        // Add some continent-like shapes
        context.fillStyle = '#2e7d32';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 512;
            const radius = Math.random() * 50 + 20;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshPhongMaterial({ 
            map: texture,
            shininess: 10
        });
        
        this.globe = new THREE.Mesh(geometry, material);
        this.scene.add(this.globe);
        
        // Add atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(1.1, 64, 64);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x4fc3f7,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.scene.add(atmosphere);
    }
    
    createLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 3, 5);
        this.scene.add(directionalLight);
    }
    
    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 5;
    }
    
    createMarker() {
        const geometry = new THREE.SphereGeometry(0.02, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.marker = new THREE.Mesh(geometry, material);
        this.scene.add(this.marker);
        this.updateMarkerPosition();
    }
    
    latLonToVector3(lat, lon, radius = 1) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        
        const x = -radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        return new THREE.Vector3(x, y, z);
    }
    
    updateMarkerPosition() {
        const position = this.latLonToVector3(this.currentPosition.lat, this.currentPosition.lon);
        this.marker.position.copy(position);
    }
    
    addRun() {
        // Generate mock running data
        const miles = Math.random() * 10 + 2; // 2-12 miles per run
        this.totalMiles += miles;
        this.runCount++;
        
        // Calculate new position based on miles run
        const distanceRatio = miles / this.EARTH_CIRCUMFERENCE;
        const lonDelta = distanceRatio * 360;
        
        // Add some variation to latitude for more interesting paths
        const latDelta = (Math.random() - 0.5) * 10;
        
        const newLat = Math.max(-85, Math.min(85, this.currentPosition.lat + latDelta));
        const newLon = (this.currentPosition.lon + lonDelta) % 360;
        
        // Update path
        this.runningPath.push({
            start: { ...this.currentPosition },
            end: { lat: newLat, lon: newLon },
            miles: miles
        });
        
        this.currentPosition = { lat: newLat, lon: newLon };
        this.updateMarkerPosition();
        this.drawPath();
        this.updateUI();
        
        // Animate the globe
        this.animateToNewPosition();
    }
    
    drawPath() {
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
        }
        
        const points = [];
        
        // Add starting point
        points.push(this.latLonToVector3(this.cities[0].lat, this.cities[0].lon));
        
        // Add all path points
        this.runningPath.forEach(segment => {
            points.push(this.latLonToVector3(segment.end.lat, segment.end.lon));
        });
        
        // Add current position
        points.push(this.latLonToVector3(this.currentPosition.lat, this.currentPosition.lon));
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x76ff03,
            linewidth: 3
        });
        
        this.pathLine = new THREE.Line(geometry, material);
        this.scene.add(this.pathLine);
    }
    
    animateToNewPosition() {
        // Smoothly rotate globe to show new position
        const targetRotation = this.currentPosition.lon * (Math.PI / 180);
        
        const animateRotation = () => {
            const currentRotation = this.globe.rotation.y;
            const diff = targetRotation - currentRotation;
            
            if (Math.abs(diff) > 0.01) {
                this.globe.rotation.y += diff * 0.1;
                requestAnimationFrame(animateRotation);
            }
        };
        
        animateRotation();
    }
    
    updateUI() {
        document.getElementById('total-miles').textContent = this.totalMiles.toFixed(1);
        document.getElementById('run-count').textContent = this.runCount;
        
        const worldProgress = Math.min(100, (this.totalMiles / this.EARTH_CIRCUMFERENCE) * 100);
        document.getElementById('world-progress').textContent = worldProgress.toFixed(1) + '%';
        document.getElementById('progress-fill').style.width = worldProgress + '%';
        
        // Find nearest city
        const nearestCity = this.findNearestCity();
        document.getElementById('current-location').textContent = nearestCity.name;
    }
    
    findNearestCity() {
        let nearestCity = this.cities[0];
        let minDistance = Infinity;
        
        this.cities.forEach(city => {
            const distance = this.calculateDistance(this.currentPosition, city);
            if (distance < minDistance) {
                minDistance = distance;
                nearestCity = city;
            }
        });
        
        return nearestCity;
    }
    
    calculateDistance(pos1, pos2) {
        const R = 3959; // Earth radius in miles
        const dLat = (pos2.lat - pos1.lat) * (Math.PI / 180);
        const dLon = (pos2.lon - pos1.lon) * (Math.PI / 180);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(pos1.lat * (Math.PI / 180)) * Math.cos(pos2.lat * (Math.PI / 180)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    resetData() {
        this.totalMiles = 0;
        this.runCount = 0;
        this.currentPosition = { lat: 40.7128, lon: -74.0060 };
        this.runningPath = [];
        
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine = null;
        }
        
        this.updateMarkerPosition();
        this.updateUI();
    }
    
    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        if (this.isAnimating) {
            this.animate();
        }
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Rotate globe slowly
        if (this.globe) {
            this.globe.rotation.y += 0.002;
        }
        
        // Update marker position relative to globe rotation
        if (this.marker) {
            this.updateMarkerPosition();
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Global functions for button handlers
let app;

function addRun() {
    app.addRun();
}

function resetData() {
    app.resetData();
}

function toggleAnimation() {
    app.toggleAnimation();
}

// Initialize app when page loads
window.addEventListener('DOMContentLoaded', () => {
    app = new GlobetrotterApp();
    
    // Add some initial runs for demonstration
    setTimeout(() => {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => app.addRun(), i * 1000);
        }
    }, 1000);
});