package com.desafio.seatecnologia.model;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Column;

@Entity
public class Telefone {
	 @Id
	 @GeneratedValue(strategy = GenerationType.IDENTITY)
	 private Long id_telefone;
	 
	 @ManyToOne
	 @JoinColumn(name = "cliente_id", nullable = false)
	 private Cliente cliente;
	 
	 @Column(nullable = false)
	 private String telefone;
	    
	 @Column(nullable = false)
	 private String tipo;
	 
	 public Telefone() {}
	  
	 public Telefone(Cliente cliente, String telefone, String tipo) {
		    this.cliente = cliente;
		    this.telefone = telefone;
		    this.tipo = tipo;
		}

	 public Long getId_telefone() {
		 return id_telefone;
	 }

	 public void setId_telefone(Long id_telefone) {
		 this.id_telefone = id_telefone;
	 }

	 public String getTelefone() {
		 return telefone;
	 }

	 public void setTelefone(String telefone) {
		 this.telefone = telefone;
	 }

	 public String getTipo() {
		 return tipo;
	 }

	 public void setTipo(String tipo) {
		 this.tipo = tipo;
	 }

	 public Cliente getCliente() {
		 return cliente;
	 }

	 public void setCliente(Cliente cliente) {
		 this.cliente = cliente;
	 }
}
