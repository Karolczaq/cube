export const generateTemperatureGrid = (
  totalCubes: number,
  initialTemp: number
): number[][][] => {
  return Array.from({ length: totalCubes }, () =>
    Array.from({ length: totalCubes }, () =>
      Array.from({ length: totalCubes }, () => initialTemp)
    )
  );
};

export const updateTemperatureGrid = (
  grid: number[][][],
  totalCubes: number,
  alpha: number // Precomputed alpha
): number[][][] => {
  // Create a new grid to store updated temperatures
  const newGrid = JSON.parse(JSON.stringify(grid));

  // Iterate over all inner cubes (excluding boundaries)
  for (let x = 1; x < totalCubes - 1; x++) {
    for (let y = 1; y < totalCubes - 1; y++) {
      for (let z = 1; z < totalCubes - 1; z++) {
        // Current temperature
        const T = grid[x][y][z];

        // Neighboring temperatures
        const T_x_minus = grid[x - 1][y][z];
        const T_x_plus = grid[x + 1][y][z];
        const T_y_minus = grid[x][y - 1][z];
        const T_y_plus = grid[x][y + 1][z];
        const T_z_minus = grid[x][y][z - 1];
        const T_z_plus = grid[x][y][z + 1];

        // Update temperature using the heat transfer formula
        newGrid[x][y][z] =
          T +
          alpha *
            (T_x_minus +
              T_y_minus +
              T_z_minus -
              6 * T +
              T_x_plus +
              T_y_plus +
              T_z_plus);
      }
    }
  }

  // Return the updated grid
  return newGrid;
};
