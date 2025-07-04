

this.gates.push({
    id: gateId,
    x: gateX,
    y: gateY,
    direction: direction,
    sections: [
        {x: this.worldX, y: this.worldY},       // Section A 
        {x: adjacentWorldX, y: adjacentWorldY}  // Section B
    ]
});