FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
ARG REQUIREMENTS_API_URL
ARG ACTIVITIES_API_URL
ARG EVIDENCE_API_URL
ARG IDENTITY_API_URL
ARG ADMINISTRATION_API_URL
ENV REQUIREMENTS_API_URL=$REQUIREMENTS_API_URL
ENV ACTIVITIES_API_URL=$ACTIVITIES_API_URL
ENV EVIDENCE_API_URL=$EVIDENCE_API_URL
ENV IDENTITY_API_URL=$IDENTITY_API_URL
ENV ADMINISTRATION_API_URL=$ADMINISTRATION_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
