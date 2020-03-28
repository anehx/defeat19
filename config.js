module.exports = {
  serverURL: "http://localhost:3000",
  simulationSpeed: 60,
  world: {
    size: 2000,
    grid: 20,
    maxSpeed: 7,
    acceleration: 2,
  },
  player: {
    size: 20,
    bar: {
      width: 100,
      height: 10,
    },
  },
  health: {
    itemIncrease: 20,
    reduceWhenHealthy: 1,
    reduceWhenInfected: 1.5,
  },
  infection: {
    thresholdDistance: 150,
    speed: 1,
    reduceWhenHealthy: 5,
    reduceWhenInfected: 1,
  },
  item: {
    // spawn an item around every x seconds
    spawnDelay: 6,
    size: 10,
  },
};
