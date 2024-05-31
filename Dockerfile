# Use the Node.js 20 base image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
COPY ./prisma .
# Install project dependencies
RUN npm install

# Copy the entire source code to the working directory
COPY . .

# Build the production bundle
RUN npm run build

# Generate Prisma Client
RUN npx prisma generate


# Start the server using the production build
CMD ["node", "dist/main.js"]
