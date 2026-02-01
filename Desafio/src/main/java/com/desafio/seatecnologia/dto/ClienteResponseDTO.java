package com.desafio.seatecnologia.dto;

import java.util.List;

public class ClienteResponseDTO {
    public Long id;
    public String nome;
    public String cpf;
    public String cep;
    public String logradouro;
    public String bairro;
    public String cidade;
    public String uf;
    public String complemento;

    public List<TelefoneDTO> telefones;
    public List<EmailDTO> emails;
}

