import config from '../config.json';

export class Soldier {

    constructor(world) {
        this.world = world;
        this.x = 0;
        this.y = 0;
        this.counter = 0;
        this.maxHP = 200;
        this.hp = 200;
        this.exp = 0;
        this.level = 1;
        this.ap = 6.5;
        this.stamina = 100;
        this.direction = world.directions.downRight;
        this.damageList = [];
        this.questList = [];
        this.sprite = new Image();
        this.sprite.src = `${config.assetsPath}soldier.png`;
        this.hpTick = 0;
        this.movementSpeed = 2;
        this.hpRecovery = 1;
        this.moving = false;
        this.jumpAltitude = 30;
        this.jumpCounter = 0;
        this.staminaCounter = 100;
    }

    checkTile = (x, y) => {
        let world = this.world;
        return  x < 0 || y < 0 || x > world.size * world.tileWidth || y > world.size * world.tileWidth || 
                world.tiles[Math.round(x / world.tileWidth)][Math.round(y / world.tileWidth)].blocking ||
                world.objects.filter(o => x > o.x + (o.width - o.blockingWidth) / 2 - 20 && x < o.x + o.blockingWidth + (o.width - o.blockingWidth) / 2 - 10 && y > o.y - o.blockingHeight + 15 && y < o.y + 20).length > 0;
    }

    update = (keysPressed) => {
        this.moving = false;
        let stepLength = this.movementSpeed;

        if (keysPressed.sprint && this.staminaCounter > 0) {
            --this.staminaCounter;
            stepLength = stepLength << 1;
        } else if (this.staminaCounter < this.stamina) {
            keysPressed.sprint = false;
            this.staminaCounter += .2;
        }

        if (keysPressed.left || keysPressed.up || keysPressed.right || keysPressed.down) {
            let directions = this.world.directions;
            this.moving = true;

            switch(true) {
                case (keysPressed.right && !keysPressed.up && !keysPressed.down): this.direction = directions.right; break;
                case (keysPressed.left && !keysPressed.up && !keysPressed.down): this.direction = directions.left; break;
                case (keysPressed.down && !keysPressed.left && !keysPressed.right): this.direction = directions.down; break;
                case (keysPressed.up && !keysPressed.left && !keysPressed.right): this.direction = directions.up; break;
                case (keysPressed.down && keysPressed.right): this.direction = directions.downRight; break;
                case (keysPressed.down && keysPressed.left): this.direction = directions.downLeft; break;
                case (keysPressed.up && keysPressed.right): this.direction = directions.upRight; break;
                case (keysPressed.up && keysPressed.left): this.direction = directions.upLeft; break;
            }

            if (keysPressed.right && !this.checkTile(this.x + stepLength, this.y)) {
                this.x += stepLength;
            }
            if (keysPressed.left && !this.checkTile(this.x - stepLength, this.y)) {
                this.x -= stepLength;
            }
            if (keysPressed.down && !this.checkTile(this.x, this.y + stepLength)) {
                this.y += stepLength;
            }
            if (keysPressed.up && !this.checkTile(this.x, this.y - stepLength)) {
                this.y -= stepLength;
            }
        }

        this.counter = (this.counter + 1) % 60;
        if (this.jumpCounter > 0) {
            --this.jumpCounter;
        }

        // <hp recovery>
        this.hpTick = (this.hpTick + 1) % 50;
        if (this.hpTick == 0 && this.damageList.length == 0 && this.hp < this.maxHP) {
            this.hp += this.hpRecovery;
        }
        // <hp recovery>
    }

    jump = () => {
        this.jumpCounter == 0 && (this.jumpCounter = this.jumpAltitude);
    }
    
    render = (screen, a, b, keysPressed) => {
        let origin = {
            x: Math.floor(screen.width / 2),
            y: Math.floor(screen.height / 2)
        }

        let levitation = 0;
        if (this.jumpCounter >= 0) {
            let halfWay = parseInt(this.jumpAltitude / 2);
            levitation = (this.jumpCounter - halfWay > 0 ? halfWay - (this.jumpCounter - halfWay) : this.jumpAltitude / 2 + this.jumpCounter - halfWay) * 4;
        }

        let context = this.world.context;

        // <render shadow>
        context.shadowBlur = 5;
        context.shadowColor = "black";
        context.fillStyle = "rgba(0,0,0,.3)";
        context.beginPath();
        context.ellipse(origin.x + 20, origin.y + 22, Math.max(1, 12 - levitation / 10), Math.max(1, 6 - levitation / 15), 0, 0, 2 * Math.PI);
        context.fill();
        context.shadowBlur = 0;
        // </render shadow>

        context.drawImage(this.sprite, Math.floor(this.counter / 8) * 64, (this.direction + (keysPressed.attack ? (this.moving ? 8 : 24) : (this.moving ? 0 : 16))) * 64, 64, 64, origin.x - 12, origin.y - 32 - levitation, 64, 64);

        // <render hp bar>
        let soldierPosition = {
            x: origin.x,
            y: origin.y
        }
        context.lineWidth = 0.8;
        context.strokeRect(soldierPosition.x - 8, soldierPosition.y - 42 - levitation, 52, 7);
        context.fillStyle = "lightgreen";
        context.fillRect(soldierPosition.x - 7, soldierPosition.y - 41 - levitation, 50 / this.maxHP * this.hp, 5);
        context.font = "8px Arial";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText(this.hp, soldierPosition.x + 16, soldierPosition.y - 36 - levitation);
        // </render hp bar>

        // <render stamina bar>
        context.fillStyle = "black";
        context.strokeRect(soldierPosition.x - 8, soldierPosition.y - 35 - levitation, 52, 5);
        context.fillStyle = "cyan";
        context.fillRect(soldierPosition.x - 7, soldierPosition.y - 34 - levitation, 50 / this.stamina * this.staminaCounter, 3);
        // </render stamina bar>

        if (this.damageList.length > 0) {
            let _damageList = Object.assign([], this.damageList);
            let damageStartPosition = {
                x: origin.x + 20,
                y: origin.y - 90
            }
            context.fillStyle = "red";
            context.textAlign = "center"; 
            for (let i = 0; i < _damageList.length; i++) {
                context.font = 12 + _damageList[i].counter + "px Arial";
                context.fillText(_damageList[i].amount, damageStartPosition.x, damageStartPosition.y + _damageList[i].counter * 2);
                _damageList[i].counter--;
                if (_damageList[i].counter <= 0) {
                    this.damageList.splice(this.damageList.indexOf(_damageList[i]), 1);
                }
            }
        }
    };

    gainExp = (exp) => {
        this.exp += exp;
        if (this.exp >= Math.pow(this.level, 2) * 100) {
            this.levelUp();
        }        
    }

    levelUp = () => {
        this.level++;
        this.ap = this.level * this.level * 1.5 + 5;
        this.maxHP += 10;
        this.hp = this.maxHP;
    }

    receiveDamage = (amount) => {
        if (this.hp > 0) {
            this.hp -= amount;
            this.hp = this.hp < 0 ? 0 : this.hp;
            this.damageList.push({amount, counter: 22});
        }
    }

    die = () => {
        this.exp -= 100;
        if (this.exp < 0) {
            this.exp = 0;
        }
        this.level = this.exp == 0 ? 1 : Math.ceil((Math.sqrt(this.exp / 100)));
        this.ap = Math.pow(this.level, 2) * 1.5 + 5;
        this.maxHP = 200 + (this.level - 1) * 10;
        this.hp = this.maxHP;
        this.direction = this.world.directions.downRight;
    }

    showCoordinates = () => {
        this.world.context.fillStyle = "rgba(0,0,0,.6)";
        this.world.context.fillText(`Coords: ${Math.floor(this.x / this.world.tileWidth)}, ${Math.floor(this.y / this.world.tileWidth)}`, 11, 151);
        this.world.context.fillText(`${this.x}, ${this.y}`, 79, 173);
        this.world.context.fillStyle = "rgba(255,255,255,.6)";
        this.world.context.fillText(`Coords: ${Math.floor(this.x / this.world.tileWidth)}, ${Math.floor(this.y / this.world.tileWidth)}`, 10, 150);
        this.world.context.fillText(`${this.x}, ${this.y}`, 78, 172);
    }
}