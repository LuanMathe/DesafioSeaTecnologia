package com.desafio.seatecnologia.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.desafio.seatecnologia.dto.ClienteRequestDTO;
import com.desafio.seatecnologia.dto.ClienteResponseDTO;
import com.desafio.seatecnologia.dto.EmailDTO;
import com.desafio.seatecnologia.dto.TelefoneDTO;
import com.desafio.seatecnologia.model.Cliente;
import com.desafio.seatecnologia.model.Email;
import com.desafio.seatecnologia.model.Telefone;
import com.desafio.seatecnologia.repository.ClienteRepository;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    private static final int NOME_MIN = 3;
    private static final int NOME_MAX = 100;

    // letras (inclui acentos), espaços e números
    private static final String REGEX_NOME = "^[A-Za-zÀ-ÿ0-9 ]+$";
    private static final String REGEX_CPF = "^\\d{11}$";
    private static final String REGEX_CEP = "^\\d{8}$";
    private static final String REGEX_UF = "^[A-Z]{2}$";
    private static final String REGEX_EMAIL = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
    private static final String REGEX_TELEFONE = "^\\d{8,13}$"; 

    private static final Set<String> TIPOS_TELEFONE_VALIDOS;

    static {
        Set<String> tipos = new HashSet<>();
        tipos.add("CELULAR");
        tipos.add("RESIDENCIAL");
        tipos.add("COMERCIAL");
        TIPOS_TELEFONE_VALIDOS = tipos;
    }

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    // ======= GETs =======

    @Transactional(readOnly = true)
    public List<ClienteResponseDTO> listar() {
        return clienteRepository.findAll()
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClienteResponseDTO buscarPorId(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Cliente não encontrado: id=" + id));
        return toResponseDTO(cliente);
    }

    // ======= CREATE =======

    @Transactional
    public ClienteResponseDTO criar(ClienteRequestDTO dto) {
        validarRequest(dto, false, null);

        if (clienteRepository.existsByCpf(dto.cpf)) {
            throw new ApiException(HttpStatus.CONFLICT, "Já existe cliente com este CPF.");
        }

        Cliente cliente = new Cliente();
        aplicarDadosBasicos(cliente, dto);
        aplicarTelefones(cliente, dto.telefones);
        aplicarEmails(cliente, dto.emails);

        Cliente salvo = clienteRepository.save(cliente);
        return toResponseDTO(salvo);
    }

    // ======= UPDATE =======

    @Transactional
    public ClienteResponseDTO atualizar(Long id, ClienteRequestDTO dto) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Cliente não encontrado: id=" + id));

        validarRequest(dto, true, cliente);

        if (!cliente.getCpf().equals(dto.cpf) && clienteRepository.existsByCpf(dto.cpf)) {
            throw new ApiException(HttpStatus.CONFLICT, "Já existe cliente com este CPF.");
        }

        aplicarDadosBasicos(cliente, dto);

        cliente.getTelefones().clear();
        aplicarTelefones(cliente, dto.telefones);

        cliente.getEmails().clear();
        aplicarEmails(cliente, dto.emails);

        Cliente salvo = clienteRepository.save(cliente);
        return toResponseDTO(salvo);
    }

    // ======= DELETE =======

    @Transactional
    public void deletar(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Cliente não encontrado: id=" + id));
        clienteRepository.delete(cliente);
    }

    private void validarRequest(ClienteRequestDTO dto, boolean isUpdate, Cliente clienteAtual) {
        if (dto == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Corpo da requisição é obrigatório.");
        }

        dto.nome = nullSafe(dto.nome);
        dto.cpf = onlyDigits(dto.cpf);
        dto.cep = onlyDigits(dto.cep);
        dto.uf = nullSafe(dto.uf).toUpperCase();
        dto.logradouro = nullSafe(dto.logradouro);
        dto.bairro = nullSafe(dto.bairro);
        dto.cidade = nullSafe(dto.cidade);
        dto.complemento = dto.complemento == null ? null : dto.complemento.trim();
        
        // ===== Nome =====
        if (isBlank(dto.nome)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nome é obrigatório.");
        }
        if (dto.nome.length() < NOME_MIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nome deve ter no mínimo " + NOME_MIN + " caracteres.");
        }
        if (dto.nome.length() > NOME_MAX) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nome deve ter no máximo " + NOME_MAX + " caracteres.");
        }
        if (!dto.nome.matches(REGEX_NOME)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nome permite apenas letras, espaços e números.");
        }

        // ===== CPF =====
        if (isBlank(dto.cpf)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CPF é obrigatório.");
        }
        if (!dto.cpf.matches(REGEX_CPF)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CPF deve conter exatamente 11 dígitos (sem máscara).");
        }

        // ===== Endereço =====
        if (isBlank(dto.cep)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CEP é obrigatório.");
        }
        if (!dto.cep.matches(REGEX_CEP)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CEP deve conter exatamente 8 dígitos (sem máscara).");
        }

        if (isBlank(dto.logradouro)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Logradouro é obrigatório.");
        }
        if (isBlank(dto.bairro)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bairro é obrigatório.");
        }
        if (isBlank(dto.cidade)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cidade é obrigatória.");
        }

        if (isBlank(dto.uf)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "UF é obrigatória.");
        }
        if (!dto.uf.matches(REGEX_UF)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "UF inválida. Use 2 letras, ex: SP, RJ, MG.");
        }

        // ===== Emails ===== (pelo menos 1)
        if (dto.emails == null || dto.emails.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deve ser cadastrado pelo menos 1 e-mail.");
        }

        // valida formato + duplicados na própria lista
        Set<String> emailsSet = new HashSet<>();
        for (EmailDTO e : dto.emails) {
            if (e == null) continue;
            String email = nullSafe(e.email).toLowerCase();
            if (isBlank(email)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "E-mail não pode ser vazio.");
            }
            if (!email.matches(REGEX_EMAIL)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "E-mail inválido: " + email);
            }
            if (!emailsSet.add(email)) {
                throw new ApiException(HttpStatus.CONFLICT, "E-mail duplicado no cadastro: " + email);
            }
            e.email = email;
        }

        if (emailsSet.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deve ser cadastrado pelo menos 1 e-mail válido.");
        }

        // ===== Telefones ===== (pelo menos 1)
        if (dto.telefones == null || dto.telefones.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deve ser cadastrado pelo menos 1 telefone.");
        }

        // valida formato + tipo + duplicidade (telefone+tipo)
        Set<String> telTipoSet = new HashSet<>();
        boolean temTelefoneValido = false;

        for (TelefoneDTO t : dto.telefones) {
            if (t == null) continue;

            String telefone = onlyDigits(t.telefone);
            String tipo = nullSafe(t.tipo).toUpperCase();

            if (isBlank(telefone)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Telefone não pode ser vazio.");
            }
            if (!telefone.matches(REGEX_TELEFONE)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Telefone inválido (somente números, 8 a 13 dígitos).");
            }

            if (isBlank(tipo)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Tipo de telefone é obrigatório.");
            }
            if (!TIPOS_TELEFONE_VALIDOS.contains(tipo)) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Tipo de telefone inválido. Use: " + String.join(", ", TIPOS_TELEFONE_VALIDOS));
            }

            String key = tipo + "|" + telefone;
            if (!telTipoSet.add(key)) {
                throw new ApiException(HttpStatus.CONFLICT, "Telefone duplicado no cadastro (tipo+número): " + tipo + " " + telefone);
            }

            t.telefone = telefone;
            t.tipo = tipo;
            temTelefoneValido = true;
        }

        if (!temTelefoneValido) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deve ser cadastrado pelo menos 1 telefone válido.");
        }
    }

    //MAPEAMENTO / HELPERS
    
    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
    
    private void aplicarDadosBasicos(Cliente cliente, ClienteRequestDTO dto) {
        cliente.setNome(dto.nome);
        cliente.setCpf(dto.cpf);
        cliente.setCep(dto.cep);
        cliente.setLogradouro(dto.logradouro);
        cliente.setBairro(dto.bairro);
        cliente.setCidade(dto.cidade);
        cliente.setUf(dto.uf);
        cliente.setComplemento(dto.complemento);
    }

    private void aplicarTelefones(Cliente cliente, List<TelefoneDTO> telefonesDto) {
        if (telefonesDto == null) telefonesDto = new ArrayList<>();

        for (TelefoneDTO t : telefonesDto) {
            if (t == null) continue;

            Telefone tel = new Telefone();
            tel.setCliente(cliente);
            tel.setTelefone(nullSafe(t.telefone));
            tel.setTipo(nullSafe(t.tipo));
            cliente.getTelefones().add(tel);
        }
    }

    private void aplicarEmails(Cliente cliente, List<EmailDTO> emailsDto) {
        if (emailsDto == null) emailsDto = new ArrayList<>();

        for (EmailDTO e : emailsDto) {
            if (e == null) continue;

            Email em = new Email();
            em.setCliente(cliente);
            em.setEmail(nullSafe(e.email));
            cliente.getEmails().add(em);
        }
    }

    private ClienteResponseDTO toResponseDTO(Cliente c) {
        ClienteResponseDTO dto = new ClienteResponseDTO();
        dto.id = c.getId();
        dto.nome = c.getNome();
        dto.cpf = c.getCpf();
        dto.cep = c.getCep();
        dto.logradouro = c.getLogradouro();
        dto.bairro = c.getBairro();
        dto.cidade = c.getCidade();
        dto.uf = c.getUf();
        dto.complemento = c.getComplemento();

        dto.telefones = c.getTelefones().stream().map(t -> {
            TelefoneDTO td = new TelefoneDTO();
            td.telefone = t.getTelefone();
            td.tipo = t.getTipo();
            return td;
        }).collect(Collectors.toList());

        dto.emails = c.getEmails().stream().map(e -> {
            EmailDTO ed = new EmailDTO();
            ed.email = e.getEmail();
            return ed;
        }).collect(Collectors.toList());

        return dto;
    }

    private String nullSafe(String s) {
        return s == null ? "" : s.trim();
    }

    private String onlyDigits(String s) {
        if (s == null) return "";
        return s.replaceAll("\\D+", "");
    }
}
