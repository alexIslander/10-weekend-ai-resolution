# Spring Boot REST API Example

This is a simple Spring Boot microservice with one unprotected REST endpoint.

## Features
- Unprotected `/hello` endpoint that returns "Hello, World!"
- Built with Spring Boot 3.1.0
- Uses Java 17

## How to Run

1. Make sure you have Java 17+ installed
2. Download Spring Boot CLI or use Maven/Gradle to build
3. Run the application with: `java -jar target/demo-0.0.1-SNAPSHOT.jar`

## Endpoint
- `GET /hello` - Returns "Hello, World!"

## Project Structure
```
src/
├── main/
│   ├── java/com/example/demo/
│   │   ├── DemoApplication.java
│   │   └── HelloController.java
│   └── resources/
│       └── application.properties
└── test/
    └── java/com/example/demo/
```