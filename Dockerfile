# Use the official Node.js image as the base image
FROM node:24-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json .

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . . 

# Expose the port that the application will run on 
EXPOSE 3000 

# Start the application 
CMD ["npm", "run", "dev"]