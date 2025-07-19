require('dotenv').config();
const express = require('express')
const cors = require('cors')
const { supabase } = require('./src/supabaseClient')
const bcrypt = require('bcryptjs');

const app = express()
const PORT = 3001

app.use(cors({origin: '*'}));
app.use(express.json());

app.get('/api/usuarios', async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios') // Agora usando tudo minúsculo
    .select('*')

  if (error) {
    return res.status(500).json({ error: error.message })
  }
  res.json(data)
})

// Rota para criar novo usuário
app.post('/api/usuarios', async (req, res) => {
  console.log('POST /api/usuarios chamado');
  const { nome, usuario, senha, tipo } = req.body;
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nome, usuario, senha, tipo }])
    .select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json(data[0]);
});

// Rota para editar usuário
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, usuario, senha, tipo } = req.body;
  const { data, error } = await supabase
    .from('usuarios')
    .update({ nome, usuario, senha, tipo })
    .eq('id', id)
    .select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data[0]);
});

// Rota para deletar usuário
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
});

// Rota de login
app.post('/api/login', async (req, res) => {
  const { usuario, senha } = req.body;
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('usuario', usuario)
    .limit(1);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data || data.length === 0) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }
  const user = data[0];
  // Se as senhas estiverem em texto puro:
  if (user.senha !== senha) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }
  // Se usar hash, troque para: if (!bcrypt.compareSync(senha, user.senha)) { ... }
  res.json({
    id: user.id,
    nome: user.nome,
    usuario: user.usuario,
    tipo: user.tipo
  });
});

// Rotas de clientes
app.get('/api/clientes', async (req, res) => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*');
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

app.get('/api/clientes/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clientes', async (req, res) => {
  const { nome, cpfoucnpj, telefone, cidade, rua, bairro, numero, cep, bloqueado, nota } = req.body;
  const { data, error } = await supabase
    .from('clientes')
    .insert([{ nome, cpfoucnpj, telefone, cidade, rua, bairro, numero, cep, bloqueado, nota }])
    .select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json(data[0]);
});

app.put('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, cpfoucnpj, telefone, cidade, rua, bairro, numero, cep, bloqueado, nota } = req.body;
  const { data, error } = await supabase
    .from('clientes')
    .update({ nome, cpfoucnpj, telefone, cidade, rua, bairro, numero, cep, bloqueado, nota })
    .eq('id', id)
    .select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data[0]);
});

app.delete('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Primeiro, contar quantos orçamentos serão excluídos
    const { data: orcamentos, error: errorOrc } = await supabase
      .from('orcamentos')
      .select('id')
      .eq('clienteFK', id);
    
    if (errorOrc) {
      return res.status(500).json({ error: errorOrc.message });
    }
    
    // Excluir orçamentos relacionados
    if (orcamentos && orcamentos.length > 0) {
      const { error: errorDeleteOrc } = await supabase
        .from('orcamentos')
        .delete()
        .eq('clienteFK', id);
      
      if (errorDeleteOrc) {
        return res.status(500).json({ error: errorDeleteOrc.message });
      }
    }
    
    // Excluir o cliente
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(200).json({ 
      message: 'Cliente excluído com sucesso',
      orcamentosExcluidos: orcamentos ? orcamentos.length : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rotas de vendedores
app.get('/api/vendedores', async (req, res) => {
  const { data, error } = await supabase
    .from('vendedores')
    .select('*');
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

app.post('/api/vendedores', async (req, res) => {
  const { nome, numero } = req.body;
  const { data, error } = await supabase
    .from('vendedores')
    .insert([{ nome, numero }])
    .select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json(data[0]);
});

app.put('/api/vendedores/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, numero } = req.body;
  const { data, error } = await supabase
    .from('vendedores')
    .update({ nome, numero })
    .eq('id', id)
    .select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data[0]);
});

app.delete('/api/vendedores/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Primeiro, contar quantos orçamentos serão excluídos
    const { data: orcamentos, error: errorOrc } = await supabase
      .from('orcamentos')
      .select('id')
      .eq('vendedorFK', id);
    
    if (errorOrc) {
      return res.status(500).json({ error: errorOrc.message });
    }
    
    // Excluir orçamentos relacionados
    if (orcamentos && orcamentos.length > 0) {
      const { error: errorDeleteOrc } = await supabase
        .from('orcamentos')
        .delete()
        .eq('vendedorFK', id);
      
      if (errorDeleteOrc) {
        return res.status(500).json({ error: errorDeleteOrc.message });
      }
    }
    
    // Excluir o vendedor
    const { error } = await supabase
      .from('vendedores')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(200).json({ 
      message: 'Vendedor excluído com sucesso',
      orcamentosExcluidos: orcamentos ? orcamentos.length : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rotas de produtos
app.get('/api/produtos', async (req, res) => {
  console.log('GET /api/produtos chamado');
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*');
    
    console.log('Resultado da consulta:', { data, error });
    
    if (error) {
      console.error('Erro na consulta:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log('Produtos encontrados:', data?.length || 0);
    res.json(data || []);
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/produtos', async (req, res) => {
  console.log('POST /api/produtos chamado');
  console.log('Dados recebidos:', req.body);
  
  const { nome, preco, descricao, ativo, medida } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('produtos')
      .insert([{ nome, preco, descricao, ativo, medida }])
      .select();
    
    console.log('Resultado da inserção:', { data, error });
    
    if (error) {
      console.error('Erro na inserção:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log('Produto criado:', data[0]);
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, preco, descricao, ativo, medida } = req.body;
  const { data, error } = await supabase
    .from('produtos')
    .update({ nome, preco, descricao, ativo, medida })
    .eq('id', id)
    .select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data[0]);
});

app.delete('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', id);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
});

// Rotas de orçamentos
app.get('/api/orcamentos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orcamentos', async (req, res) => {
  const { clienteFK, vendedorFK, totalOrcamento, parcelas, desconto } = req.body;
  try {
    const { data, error } = await supabase
      .from('orcamentos')
      .insert([{ clienteFK, vendedorFK, totalOrcamento, parcelas, desconto }])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orcamentos/:id', async (req, res) => {
  const { id } = req.params;
  const { clienteFK, vendedorFK, totalOrcamento, parcelas, desconto } = req.body;
  try {
    const { data, error } = await supabase
      .from('orcamentos')
      .update({ clienteFK, vendedorFK, totalOrcamento, parcelas, desconto })
      .eq('id', id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orcamentos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para atualizar status de faturamento
app.patch('/api/orcamentos/:id/faturar', async (req, res) => {
  const { id } = req.params;
  const { faturada } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('orcamentos')
      .update({ faturada })
      .eq('id', id)
      .select();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rotas de itens do orçamento
app.get('/api/itens-orcamento/:orcamentoId', async (req, res) => {
  const { orcamentoId } = req.params;
  try {
    const { data, error } = await supabase
      .from('itensOrcamento')
      .select('*')
      .eq('orcamentoFK', orcamentoId);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/itens-orcamento', async (req, res) => {
  const { orcamentoFK, produtoFK, largura, altura, area, quantidade, transpasso } = req.body;
  try {
    const { data, error } = await supabase
      .from('itensOrcamento')
      .insert([{ orcamentoFK, produtoFK, largura, altura, area, quantidade, transpasso }])
      .select();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/itens-orcamento/:id', async (req, res) => {
  const { id } = req.params;
  const { orcamentoFK, produtoFK, largura, altura, area, quantidade, transpasso } = req.body;
  try {
    const { data, error } = await supabase
      .from('itensOrcamento')
      .update({ orcamentoFK, produtoFK, largura, altura, area, quantidade, transpasso })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/itens-orcamento/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('itensOrcamento')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/itens-orcamento/orcamento/:orcamentoId', async (req, res) => {
  const { orcamentoId } = req.params;
  try {
    const { error } = await supabase
      .from('itensOrcamento')
      .delete()
      .eq('orcamentoFK', orcamentoId);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ROTAS DE ALERTAS/LEMBRETES =====
app.get('/api/alertas', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerta')
      .select('*')
      .order('dataAlert');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orcamentos/:orcamentoId/alertas', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerta')
      .select('*')
      .eq('orcamentoFK', req.params.orcamentoId)
      .order('dataAlert');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/alertas', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerta')
      .insert([req.body])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orcamentos/:orcamentoId/alertas', async (req, res) => {
  try {
    const alertaData = {
      ...req.body,
      orcamentoFK: req.params.orcamentoId
    };
    
    const { data, error } = await supabase
      .from('alerta')
      .insert([alertaData])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/alertas/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerta')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/alertas/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('alerta')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Alerta excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ROTAS DE VENDAS =====
app.get('/api/vendas', async (req, res) => {
  try {
    console.log('Buscando vendas...');
    const { data, error } = await supabase
      .from('vendas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    console.log('Vendas encontradas:', data?.length || 0);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vendas/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const { data, error } = await supabase
      .from('vendas')
      .select(`
        *,
        orcamentos (
          id,
          totalOrcamento,
          data,
          clientes (id, nome, telefone),
          vendedores (id, nome)
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar venda (faturar orçamento)
app.post('/api/vendas', async (req, res) => {
  try {
    const { orcamento_id, observacoes } = req.body;
    
    // Buscar dados do orçamento
    const { data: orcamento, error: orcError } = await supabase
      .from('orcamentos')
      .select(`
        *,
        clientes (id, nome),
        vendedores (id, nome)
      `)
      .eq('id', orcamento_id)
      .single();
    
    if (orcError) throw orcError;
    if (!orcamento) throw new Error('Orçamento não encontrado');
    
    // Criar a venda
    const vendaData = {
      orcamento_id: orcamento.id,
      cliente_id: orcamento.clienteFK,
      vendedor_id: orcamento.vendedorFK,
      status: 'faturada',
      valor_total: orcamento.totalOrcamento,
      observacoes: observacoes || null
    };
    
    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .insert([vendaData])
      .select()
      .single();
    
    if (vendaError) throw vendaError;
    
    // Atualizar o orçamento para faturado
    const { error: updateError } = await supabase
      .from('orcamentos')
      .update({ faturada: true })
      .eq('id', orcamento_id);
    
    if (updateError) throw updateError;
    
    res.status(201).json(venda);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancelar venda
app.put('/api/vendas/:id/cancelar', async (req, res) => {
  try {
    const { id } = req.params;
    const { observacoes } = req.body;
    
    // Buscar a venda
    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (vendaError) throw vendaError;
    if (!venda) throw new Error('Venda não encontrada');
    if (venda.status === 'cancelada') throw new Error('Venda já está cancelada');
    
    // Atualizar a venda para cancelada
    const { data: updatedVenda, error: updateError } = await supabase
      .from('vendas')
      .update({ 
        status: 'cancelada',
        data_cancelada: new Date().toISOString(),
        observacoes: observacoes || venda.observacoes
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    // Não alterar o campo faturada do orçamento quando cancelar uma venda já confirmada
    // O orçamento permanece faturado, mas a venda fica cancelada
    
    res.json(updatedVenda);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancelar orçamento em processo (quando cliente não paga)
app.put('/api/orcamentos/:id/cancelar-processo', async (req, res) => {
  try {
    const { id } = req.params;
    const { observacoes } = req.body;
    
    // Buscar o orçamento
    const { data: orcamento, error: orcError } = await supabase
      .from('orcamentos')
      .select(`
        *,
        clientes (id, nome),
        vendedores (id, nome)
      `)
      .eq('id', id)
      .single();
    
    if (orcError) throw orcError;
    if (!orcamento) throw new Error('Orçamento não encontrado');
    if (!orcamento.faturada) throw new Error('Orçamento não está em processo');
    
    // Criar venda cancelada
    const vendaData = {
      orcamento_id: orcamento.id,
      cliente_id: orcamento.clienteFK,
      vendedor_id: orcamento.vendedorFK,
      status: 'cancelada',
      valor_total: orcamento.totalOrcamento,
      data_cancelada: new Date().toISOString(),
      observacoes: observacoes || null
    };
    
    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .insert([vendaData])
      .select()
      .single();
    
    if (vendaError) throw vendaError;
    
    // Manter o orçamento como faturado (para histórico)
    // A venda cancelada será exibida na aba "Canceladas"
    
    res.json(venda);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
}) 
