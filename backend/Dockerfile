# Stage 1: Build the application
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy gradle files
COPY gradle gradle
COPY gradlew .
COPY build.gradle .
COPY settings.gradle .

# Ensure gradlew is executable
RUN chmod +x gradlew

# Download dependencies (cache layer)
RUN ./gradlew dependencies --no-daemon

# Copy source code
COPY src src

# Build jar
RUN ./gradlew bootJar -x test --no-daemon

# Stage 2: Create the final image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port (Spring Boot default, or fallback to PORT env variable)
EXPOSE 8080

# Run the jar with dynamic port binding and IPv4 preference
ENTRYPOINT ["java", "-Djava.net.preferIPv4Stack=true", "-Dserver.port=${PORT:8080}", "-jar", "app.jar"]
