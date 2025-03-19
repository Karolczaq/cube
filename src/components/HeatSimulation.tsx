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
  alpha: number
): number[][][] => {
  const newGrid = JSON.parse(JSON.stringify(grid));
  for (let x = 1; x < totalCubes - 1; x++) {
    for (let y = 1; y < totalCubes - 1; y++) {
      for (let z = 1; z < totalCubes - 1; z++) {
        const T = grid[x][y][z];

        const T_x_minus = grid[x - 1][y][z];
        const T_x_plus = grid[x + 1][y][z];
        const T_y_minus = grid[x][y - 1][z];
        const T_y_plus = grid[x][y + 1][z];
        const T_z_minus = grid[x][y][z - 1];
        const T_z_plus = grid[x][y][z + 1];

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

  return newGrid;
};
