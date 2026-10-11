FROM golang:alpine3.23 AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o app ./cmd/core

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/app .

EXPOSE 8081

CMD ["./app"]
