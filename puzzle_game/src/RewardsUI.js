export class RewardsUI {
    constructor(playerId) {
        this.playerId = playerId;
        this.skins = [];
        this.badges = [];
        this.currentSkin = null;
        this.container = null;
        this.onSkinChange = null; // C'est juste une variable qui va contenir la fonction 
        // Au début, pas de fonction définie
        
        this.init();
    }
    
    async init() {
        // Create UI container
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 50, 0.95);
            padding: 20px;
            border-radius: 10px;
            color: white;
            font-family: Arial, sans-serif;
            display: none;
            z-index: 1000;
            min-width: 600px;
        `;
        
        // Create tabs
        const tabs = this.createTabs();
        this.container.appendChild(tabs);
        
        // Create content container
        this.contentContainer = document.createElement('div');
        this.contentContainer.style.padding = '20px';
        this.container.appendChild(this.contentContainer);
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        closeButton.onclick = () => this.hide();
        this.container.appendChild(closeButton);
        
        document.body.appendChild(this.container);
        
        // Load initial data
        await this.loadSkins();
        await this.loadBadges();
        this.showSkins(); // Show skins by default
    }
    
    createTabs() {
        const tabContainer = document.createElement('div');
        tabContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        `;
        
        const skinsTab = this.createTab('Skins', () => this.showSkins());
        const badgesTab = this.createTab('Badges', () => this.showBadges());
        
        tabContainer.appendChild(skinsTab);
        tabContainer.appendChild(badgesTab);
        
        return tabContainer;
    }
    
    createTab(text, onClick) {
        const tab = document.createElement('button');
        tab.textContent = text;
        tab.style.cssText = `
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            flex: 1;
        `;
        tab.onclick = onClick;
        return tab;
    }
    
    async loadSkins() {
        try {
            const response = await fetch(`/api/skins/player/${this.playerId}`);
            this.skins = await response.json();
        } catch (error) {
            console.error('Error loading skins:', error);
        }
    }
    
    async loadBadges() {
        try {
            const response = await fetch(`/api/badges/player/${this.playerId}`);
            this.badges = await response.json();
        } catch (error) {
            console.error('Error loading badges:', error);
        }
    }
    
    showSkins() {
        this.contentContainer.innerHTML = '';
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        `;
        
        this.skins.forEach(skin => {
            const card = this.createSkinCard(skin);
            grid.appendChild(card);
        });
        
        this.contentContainer.appendChild(grid);
    }
    
    showBadges() {
        this.contentContainer.innerHTML = '';
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        `;
        
        this.badges.forEach(badge => {
            const card = this.createBadgeCard(badge);
            grid.appendChild(card);
        });
        
        this.contentContainer.appendChild(grid);
    }
    
    createSkinCard(skin) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: transform 0.2s;
        `;
        
        const image = document.createElement('img');
        image.src = skin.thumbnailPath;
        image.style.cssText = `
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 4px;
            margin-bottom: 10px;
        `;
        
        const name = document.createElement('h3');
        name.textContent = skin.name;
        name.style.margin = '10px 0';
        
        const equip = document.createElement('button');
        equip.textContent = 'Equip';
        equip.style.cssText = `
            padding: 5px 15px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        equip.onclick = async () => {
            await this.equipSkin(skin.id);
        };
        
        card.appendChild(image);
        card.appendChild(name);
        card.appendChild(equip);
        
        return card;
    }
    
    createBadgeCard(badge) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        `;
        
        const image = document.createElement('img');
        image.src = badge.imagePath;
        image.style.cssText = `
            width: 100px;
            height: 100px;
            object-fit: contain;
            margin-bottom: 10px;
        `;
        
        const name = document.createElement('h3');
        name.textContent = badge.name;
        name.style.margin = '10px 0';
        
        const description = document.createElement('p');
        description.textContent = badge.description;
        description.style.fontSize = '14px';
        
        card.appendChild(image);
        card.appendChild(name);
        card.appendChild(description);
        
        return card;
    }
    
    async equipSkin(skinId) {
        try {

            // 1. Fait une requête au backend pour équiper le skin
            await fetch(`/api/skins/equip?playerId=${this.playerId}&skinId=${skinId}`, {
                method: 'POST'
            });
            
            // 2. Une fois le skin équipé dans la base de données, met à jour le modèle 3D
            if (this.onSkinChange) { // Si une fonction a été assignée
                // 3. Trouve le skin sélectionné dans la liste des skins disponibles
                const skin = this.skins.find(s => s.id === skinId);
                // 4. Appelle la fonction de callback avec le chemin du nouveau modèle
                this.onSkinChange(skin.modelPath); // On l'appelle
            }
        } catch (error) {
            console.error('Error equipping skin:', error);
        }
    }
    
    show() {
        this.container.style.display = 'block';
    }
    
    hide() {
        this.container.style.display = 'none';
    }
    
    showBadgePopup(badge) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 50, 0.95);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            color: white;
            z-index: 1100;
            animation: popIn 0.5s ease-out;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes popIn {
                0% { transform: translate(-50%, -50%) scale(0); }
                70% { transform: translate(-50%, -50%) scale(1.1); }
                100% { transform: translate(-50%, -50%) scale(1); }
            }
            
            @keyframes shine {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        const shine = document.createElement('div');
        shine.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at center, transparent 30%, rgba(255,255,255,0.2) 70%);
            animation: shine 4s linear infinite;
        `;
        
        const title = document.createElement('h2');
        title.textContent = 'New Badge Unlocked!';
        title.style.color = '#FFD700';
        
        const image = document.createElement('img');
        image.src = badge.imagePath;
        image.style.cssText = `
            width: 150px;
            height: 150px;
            margin: 20px 0;
        `;
        
        const name = document.createElement('h3');
        name.textContent = badge.name;
        name.style.marginBottom = '10px';
        
        const description = document.createElement('p');
        description.textContent = badge.description;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Awesome!';
        closeButton.style.cssText = `
            margin-top: 20px;
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        closeButton.onclick = () => {
            document.body.removeChild(popup);
        };
        
        popup.appendChild(shine);
        popup.appendChild(title);
        popup.appendChild(image);
        popup.appendChild(name);
        popup.appendChild(description);
        popup.appendChild(closeButton);
        
        document.body.appendChild(popup);
    }
}
