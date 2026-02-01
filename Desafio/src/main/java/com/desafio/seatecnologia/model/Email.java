package com.desafio.seatecnologia.model;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Column;

@Entity
public class Email {
	@Id
	 @GeneratedValue(strategy = GenerationType.IDENTITY)
	 private Long id_email;
	
	 @ManyToOne
	 @JoinColumn(name = "cliente_id", nullable = false)
	 private Cliente cliente;
	 
	 @Column(nullable = false)
	 private String email;
	    
	 public Email() {}
	 
	 public Email(Cliente cliente, String email) {
		    this.cliente = cliente;
		    this.email = email;
		}

	 public Long getId_email() {
		 return id_email;
	 }

	 public void setId_email(Long id_email) {
		 this.id_email = id_email;
	 }

	 public String getEmail() {
		 return email;
	 }

	 public void setEmail(String email) {
		 this.email = email;
	 }
	 
	 public Cliente getCliente() {
		 return cliente;
	 }

	 public void setCliente(Cliente cliente) {
		 this.cliente = cliente;
	 }
}
