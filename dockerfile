# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the container
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the project files to the container
COPY . .

# Expose port 3000 to be accessible outside the container
EXPOSE 3000

# Run the Next.js development server
CMD ["npm", "run", "dev"]
