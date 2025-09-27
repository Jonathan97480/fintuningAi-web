FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY ./src ./src
COPY next.config.ts tsconfig.json eslint.config.mjs ./
CMD [\"npm\", \"run\", \"dev\", \"--\", \"-p\", \"3000\"]
