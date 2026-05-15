package main

import (
	"log"

	"github.com/winnerx0/kivia/api"
	"github.com/winnerx0/kivia/internal/config"
	"github.com/winnerx0/kivia/internal/rabbitmq"
)

func main() {

	config := config.Load()

	rabbitMQClient := rabbitmq.NewRabbitMQClient(config.RabbitMQConnectionUrl)

	defer rabbitMQClient.Close()

	server := api.NewServer(*config, rabbitMQClient)

	if err := server.Start(); err != nil {
		log.Fatal("Error starting server ", err)
	}
}
