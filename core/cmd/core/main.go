package main

import (
	"log"

	"github.com/winnerx0/kivia/api"
	"github.com/winnerx0/kivia/internal/config"
)

func main() {

	config := config.Load()

	server := api.NewServer(*config)

	if err := server.Start(); err != nil {
		log.Fatal("Error starting server ", err)
	}
}
