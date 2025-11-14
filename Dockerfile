# File: ./Dockerfile (in the root folder)

# --- 1. Build Frontend ---
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- 2. Build Backend ---
FROM node:20-alpine AS final
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev
COPY backend/ .

# --- CRITICAL STEP ---
# Copy the built React app from the 'build' stage
# The 'build' folder matches what we put in app.js
COPY --from=build /app/dist ./build

# Expose the backend port
EXPOSE 5200

# Run the app
CMD ["node", "app.js"]