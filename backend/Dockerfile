# Build stage: compile with the Maven wrapper so the build matches local development.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -q -B dependency:go-offline
COPY src src
RUN ./mvnw -q -B -DskipTests package

# Runtime stage: JRE only, non-root user.
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 1001 app
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
