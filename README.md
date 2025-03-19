# Simple thermal conductivity simulation
*Made using Three.js* <br>
The animation is smooth up to 6x6x6 cube. For the more discretized cube you can use the code in HeatSimulation.tsx to simulate it further, but without the animation, because it's unusable for those cubes.
You can use mouse and scroll to move around and look inside the cube

# Running it locally:
1. pnpm install
2. pnpm dev

# Explanation of the calculation:
We are considering the heating process of a cube with density ρ -- modeling how heat propagates throughout the interior of the cube -- where different parts can have different temperatures at a given moment. For this purpose, we divide the cube into small cubes with dimensions Δx, Δy, Δz (where Δy = Δx, Δz = Δx). The function T(x,y,z,t) describes the temperature of a small cube with its center at point x,y,z at time t. We assume that the temperature of each small cube is constant within that cube, although different cubes may have different temperatures. The change in temperature of a small cube over time Δt is derived from the specific heat equation c:

$$\left[\frac{T(x,y,z,t+\Delta t)-T(x,y,z,t)}{\Delta t}\right]c\rho\Delta x\Delta y\Delta z=\Delta Q     (1)$$

where ΔQ represents the net heat flow through the surface of the small cube between time t and t+Δt. This heat can be written as the sum of contributions from walls perpendicular to the x, y, and z axes:

$$\Delta Q=\Delta Q_{x,1}+\Delta Q_{y,1}+\Delta Q_{z,1}+\Delta Q_{x,2}+\Delta Q_{y,2}+\Delta Q_{z,2}$$

The amount of heat transferred through a wall with surface area S is expressed by the heat conduction equation (see: [Heat Conduction](https://en.wikipedia.org/wiki/Thermal_conduction)):

$$\Delta Q=k\frac{S\Delta T}{d}\Delta t,     (2)$$

where d represents the thickness of the barrier, which in our case is one of the distances Δx, Δy, Δz. For the two walls in the x direction:

$$\Delta Q_{x,1}=k\cdot\frac{\Delta y\Delta z}{\Delta x}[T(x,y,z,t)-T(x-\Delta x,y,z,t)]\Delta t     (3)$$

$$\Delta Q_{x,2}=k\cdot\frac{\Delta y\Delta z}{\Delta x}[T(x,y,z,t)-T(x+\Delta x,y,z,t)]\Delta t     (4)$$

where ΔyΔz is the surface area where the cube contacts the adjacent surface. After equating equations (1) and (3) and dividing by ΔxΔyΔzΔt, we obtain:

$$T(x,y,z,t+\Delta t)-T(x,y,z,t)=\frac{k}{c\rho(\Delta x)^2}[-T(x-\Delta x,y,z,t)-T(x,y-\Delta y,z,t)-T(x,y,z-\Delta z,t)     (5)$$

$$+6T(x,y,z,t)-T(x+\Delta x,y,z,t)-T(x,y+\Delta y,z,t)-T(x,y,z+\Delta z,t)]\Delta t     (6)$$
