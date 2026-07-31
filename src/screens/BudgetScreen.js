import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Modal
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatMoney } from '../utils/format';
import { calcularOrcamento, custoInsumo } from '../utils/calculator';
import { sanitizeNumber, validateInsumo, toNumber } from '../utils/validators';
import { saveBudgetController } from '../controllers/budgetController';
import { useAuth } from '../contexts/AuthContext';
import { reportError } from '../utils/errorHandler';

// Dicionário visual para deixar a lista de ingredientes elegante
const MAPA_UNIDADES = {
  un: 'Unidades',
  g: 'Gramas',
  kg: 'Quilos',
  ml: 'Mililitros',
  l: 'Litros'
};

// =====================================================================
// PLANILHA TRIBUTÁRIA NACIONAL (Regime Especial + Federal)
// =====================================================================
const FEDERAL_TAX = 3.65; // PIS + COFINS
const ESTADOS_TAXAS = [
  { uf: 'AC', nome: 'Acre', taxa: 3.5 },
  { uf: 'AL', nome: 'Alagoas', taxa: 4.0 },
  { uf: 'AP', nome: 'Amapá', taxa: 3.0 },
  { uf: 'AM', nome: 'Amazonas', taxa: 3.2 },
  { uf: 'BA', nome: 'Bahia', taxa: 4.0 },
  { uf: 'CE', nome: 'Ceará', taxa: 3.2 },
  { uf: 'DF', nome: 'Distrito Federal', taxa: 2.0 },
  { uf: 'ES', nome: 'Espírito Santo', taxa: 3.2 },
  { uf: 'GO', nome: 'Goiás', taxa: 7.0 },
  { uf: 'MA', nome: 'Maranhão', taxa: 3.0 },
  { uf: 'MT', nome: 'Mato Grosso', taxa: 3.2 },
  { uf: 'MS', nome: 'Mato Grosso do Sul', taxa: 3.2 },
  { uf: 'MG', nome: 'Minas Gerais', taxa: 3.0 },
  { uf: 'PA', nome: 'Pará', taxa: 4.0 },
  { uf: 'PB', nome: 'Paraíba', taxa: 4.0 },
  { uf: 'PR', nome: 'Paraná', taxa: 3.2 },
  { uf: 'PE', nome: 'Pernambuco', taxa: 4.0 },
  { uf: 'PI', nome: 'Piauí', taxa: 4.0 },
  { uf: 'RJ', nome: 'Rio de Janeiro', taxa: 3.0 },
  { uf: 'RN', nome: 'Rio Grande do Norte', taxa: 4.0 },
  { uf: 'RS', nome: 'Rio Grande do Sul', taxa: 4.8 },
  { uf: 'RO', nome: 'Rondônia', taxa: 3.2 },
  { uf: 'RR', nome: 'Roraima', taxa: 4.0 },
  { uf: 'SC', nome: 'Santa Catarina', taxa: 3.2 },
  { uf: 'SP', nome: 'São Paulo', taxa: 4.0 },
  { uf: 'SE', nome: 'Sergipe', taxa: 4.0 },
  { uf: 'TO', nome: 'Tocantins', taxa: 4.0 }
];

export default function BudgetScreen({
  token, onBudgetSaved, isDarkMode, onShowToast, configGlobal, initialBudget, onClearEditing
}) {
  const auth = useAuth();
  const effectiveToken = token || auth?.token;
  
  const [nomeProduto, setNomeProduto] = useState('');
  const [qtdProduto, setQtdProduto] = useState('');
  const [unidadeProduto, setUnidadeProduto] = useState('un');
  const [precoVendaValor, setPrecoVendaValor] = useState('');
  const [precoVendaTipo, setPrecoVendaTipo] = useState('total');
  const [imposto, setImposto] = useState('');
  const [modoCusto, setModoCusto] = useState('automatico');
  const [tempoPreparo, setTempoPreparo] = useState('');
  const [custoManual, setCustoManual] = useState('');
  const [insumos, setInsumos] = useState([]); 
  const [showAdicionarInsumo, setShowAdicionarInsumo] = useState(false); 
  const [novoInsumo, setNovoInsumo] = useState({
    nome: '', preco: '', qtdLote: '', unidadeLote: 'kg', qtdUsada: '', unidadeUsada: 'g'
  });
  
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [showTaxModal, setShowTaxModal] = useState(false); // Modal de Impostos

  useEffect(() => {
    if (!initialBudget) {
      setIsEditing(false);
      return;
    }

    // Campos ausentes viravam `undefined` no TextInput, que deixa o input
    // descontrolado e faz o React perder o que o usuário digita depois.
    setIsEditing(true);
    setNomeProduto(initialBudget.nome ?? '');
    setQtdProduto(initialBudget.qtdProduto?.toString() ?? '');
    setUnidadeProduto(initialBudget.unidadeProduto || 'un');
    setPrecoVendaValor(initialBudget.precoVendaValor?.toString() ?? '');
    setPrecoVendaTipo(initialBudget.precoVendaTipo || 'total');
    setImposto(initialBudget.imposto?.toString() ?? '');
    setModoCusto(initialBudget.modoCusto || 'automatico');
    setTempoPreparo(initialBudget.tempoPreparo?.toString() ?? '');
    setCustoManual(initialBudget.custoManual?.toString() ?? '');

    setInsumos(
      Array.isArray(initialBudget.insumos)
        ? initialBudget.insumos.map((ins, index) => ({
            id: ins?.id != null ? String(ins.id) : `insumo-${index}-${initialBudget.id ?? 'novo'}`,
            nome: ins?.nome ?? '',
            preco: ins?.preco,
            qtdLote: ins?.qtdLote,
            unidadeLote: ins?.unidadeLote || 'kg',
            qtdUsada: ins?.qtdUsada,
            unidadeUsada: ins?.unidadeUsada || 'g'
          }))
        : []
    );
  }, [initialBudget]);

  const adicionarInsumo = () => {
    // Validação centralizada em validators.js, em vez de duplicada aqui.
    const erro = validateInsumo(novoInsumo);
    if (erro) {
      return onShowToast?.(erro, 'error');
    }

    setInsumos(prev => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        nome: novoInsumo.nome.trim(),
        preco: toNumber(novoInsumo.preco),
        qtdLote: toNumber(novoInsumo.qtdLote),
        unidadeLote: novoInsumo.unidadeLote,
        qtdUsada: toNumber(novoInsumo.qtdUsada),
        unidadeUsada: novoInsumo.unidadeUsada
      }
    ]);

    setNovoInsumo({ nome: '', preco: '', qtdLote: '', unidadeLote: 'kg', qtdUsada: '', unidadeUsada: 'g' });
    setShowAdicionarInsumo(false);
  };

  const removerInsumo = (id) => {
    setInsumos(prev => prev.filter(item => item.id !== id));
  };

  const preview = useMemo(() => {
    const data = {
      insumos,
      modoCusto,
      tempoPreparo: sanitizeNumber(tempoPreparo),
      custoManual: sanitizeNumber(custoManual),
      configGlobal: configGlobal || { gas: '', luz: '', agua: '', horas: '' },
      imposto: sanitizeNumber(imposto),
      qtdProduto: sanitizeNumber(qtdProduto),
      unidadeProduto,
      precoVendaValor: sanitizeNumber(precoVendaValor),
      precoVendaTipo
    };
    return calcularOrcamento(data);
  }, [insumos, modoCusto, tempoPreparo, custoManual, configGlobal, imposto, qtdProduto, unidadeProduto, precoVendaValor, precoVendaTipo]);

  const handleSave = async () => {
    // Trava síncrona contra duplo toque: `saving` só vale no próximo render,
    // então dois toques no mesmo frame salvavam o orçamento duas vezes.
    if (savingRef.current) return;
    savingRef.current = true;

    const payload = {
      nomeProduto,
      insumos: insumos.map(i => ({ nome: i.nome, preco: i.preco, qtdLote: i.qtdLote, unidadeLote: i.unidadeLote, qtdUsada: i.qtdUsada, unidadeUsada: i.unidadeUsada })),
      qtdProduto: toNumber(qtdProduto), unidadeProduto, precoVendaValor: toNumber(precoVendaValor), precoVendaTipo,
      imposto: toNumber(imposto), modoCusto, tempoPreparo: toNumber(tempoPreparo), custoManual: toNumber(custoManual),
      configGlobal: configGlobal || {}
    };

    setSaving(true);
    try {
      const response = await saveBudgetController(payload, effectiveToken);

      // O interceptador da API já achata o erro em uma Error simples, então
      // `error.response` nunca existia aqui. O que faltava era validar o sucesso:
      // uma resposta sem `budget` estourava dentro deste try e o usuário via
      // "falha ao salvar" mesmo com o orçamento gravado no servidor.
      const budgetSalvo = response?.budget ?? response?.data?.budget ?? null;

      onBudgetSaved?.(budgetSalvo);
      limparFormulario();
    } catch (error) {
      reportError(error, 'saveBudget');
      onShowToast?.(error?.message || 'Falha ao salvar orçamento.', 'error');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const limparFormulario = () => {
    setNomeProduto(''); setQtdProduto(''); setUnidadeProduto('un'); setPrecoVendaValor(''); setPrecoVendaTipo('total');
    setImposto(''); setModoCusto('automatico'); setTempoPreparo(''); setCustoManual(''); setInsumos([]); setIsEditing(false);
    if (onClearEditing) onClearEditing();
  };

  return (
    <>
      <ScrollView 
        style={[styles.screen, isDarkMode && styles.screenDark]} 
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }} 
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>{isEditing ? 'Editar orçamento' : 'Novo orçamento'}</Text>
          <Text style={[styles.sectionSubtitle, isDarkMode && styles.sectionSubtitleDark]}>Defina o produto, insumos e preço – o app calcula tudo em tempo real.</Text>
        </View>

        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Nome do produto</Text>
          <TextInput style={[styles.input, isDarkMode && styles.inputDark]} placeholder="Ex: Bolo de Cenoura" placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'} value={nomeProduto} onChangeText={setNomeProduto} />

          <View style={styles.gridRow}>
            <View style={[styles.flex, { marginRight: 12 }]}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Rendimento</Text>
              <TextInput style={[styles.input, isDarkMode && styles.inputDark]} placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'} placeholder="Ex: 1" keyboardType="numeric" value={qtdProduto} onChangeText={text => setQtdProduto(sanitizeNumber(text))} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Unidade</Text>
              <View style={[styles.pickerWrapper, isDarkMode && styles.pickerWrapperDark]}>
                <Picker selectedValue={unidadeProduto} onValueChange={setUnidadeProduto} style={[styles.picker, isDarkMode && styles.pickerDark]} dropdownIconColor={isDarkMode ? '#94a3b8' : '#64748b'}>
                  {['un', 'kg', 'g', 'l', 'ml'].map(u => <Picker.Item key={u} label={u} value={u} />)}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={[styles.flex, { marginRight: 12 }]}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Preço de venda (R$)</Text>
              <TextInput style={[styles.input, isDarkMode && styles.inputDark]} placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'} placeholder="0,00" keyboardType="numeric" value={precoVendaValor} onChangeText={text => setPrecoVendaValor(sanitizeNumber(text))} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Tipo de preço</Text>
              <View style={[styles.pickerWrapper, isDarkMode && styles.pickerWrapperDark]}>
                <Picker selectedValue={precoVendaTipo} onValueChange={setPrecoVendaTipo} style={[styles.picker, isDarkMode && styles.pickerDark]}>
                  {[{ label: 'Receita total', value: 'total' }, { label: 'por Kg', value: 'kg' }, { label: 'por Litro', value: 'l' }, { label: 'por Unidade', value: 'un' }].map(t => <Picker.Item key={t.value} label={t.label} value={t.value} />)}
                </Picker>
              </View>
            </View>
          </View>
          
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>Imposto (%)</Text>
          <View style={styles.taxInputContainer}>
            <TextInput 
              style={[styles.input, styles.taxInput, isDarkMode && styles.inputDark]} 
              placeholder="0,00" 
              placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'} 
              keyboardType="numeric" 
              value={imposto} 
              onChangeText={text => setImposto(sanitizeNumber(text))} 
            />
            <TouchableOpacity 
              style={[styles.taxButton, isDarkMode && styles.taxButtonDark]} 
              onPress={() => setShowTaxModal(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="calculator-variant" size={20} color="#ffffff" />
              <Text style={styles.taxButtonText}>Sugerir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={isDarkMode ? '#93c5fd' : '#2563eb'} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Insumos</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAdicionarInsumo(!showAdicionarInsumo)}>
              <Text style={[styles.linkText, isDarkMode && styles.linkTextDark]}>
                {showAdicionarInsumo ? 'Cancelar' : '+ Adicionar'}
              </Text>
            </TouchableOpacity>
          </View>

          {showAdicionarInsumo && (
            <View style={[styles.subCard, isDarkMode && styles.subCardDark]}>
              <TextInput style={[styles.input, isDarkMode && styles.inputDark]} placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'} placeholder="Nome do ingrediente" value={novoInsumo.nome} onChangeText={text => setNovoInsumo(prev => ({ ...prev, nome: text }))} />
              <View style={styles.gridRow}>
                <TextInput style={[styles.input, styles.flex, { marginRight: 12 }, isDarkMode && styles.inputDark]} placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'} placeholder="Preço do lote (R$)" keyboardType="numeric" value={novoInsumo.preco} onChangeText={text => setNovoInsumo(prev => ({ ...prev, preco: sanitizeNumber(text) }))} />
                <TextInput style={[styles.input, styles.flex, isDarkMode && styles.inputDark]} placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'} placeholder="Qtd lote" keyboardType="numeric" value={novoInsumo.qtdLote} onChangeText={text => setNovoInsumo(prev => ({ ...prev, qtdLote: sanitizeNumber(text) }))} />
              </View>
              <View style={styles.gridRow}>
                <View style={[styles.flex, { marginRight: 8 }]}><Text style={styles.smallLabel}>Unid. lote</Text><Picker selectedValue={novoInsumo.unidadeLote} onValueChange={val => setNovoInsumo(prev => ({ ...prev, unidadeLote: val }))} style={[styles.smallPicker, isDarkMode && styles.pickerDark]} dropdownIconColor={isDarkMode ? '#94a3b8' : '#64748b'}><Picker.Item label="kg" value="kg" /><Picker.Item label="g" value="g" /><Picker.Item label="l" value="l" /><Picker.Item label="ml" value="ml" /><Picker.Item label="un" value="un" /></Picker></View>
                <View style={[styles.flex, { marginRight: 8 }]}><Text style={styles.smallLabel}>Qtd usada</Text><TextInput placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'} style={[styles.input, isDarkMode && styles.inputDark]} placeholder="Qtd" keyboardType="numeric" value={novoInsumo.qtdUsada} onChangeText={text => setNovoInsumo(prev => ({ ...prev, qtdUsada: sanitizeNumber(text) }))} /></View>
                <View style={styles.flex}><Text style={styles.smallLabel}>Unid. usada</Text><Picker selectedValue={novoInsumo.unidadeUsada} onValueChange={val => setNovoInsumo(prev => ({ ...prev, unidadeUsada: val }))} style={[styles.smallPicker, isDarkMode && styles.pickerDark]} dropdownIconColor={isDarkMode ? '#94a3b8' : '#64748b'}><Picker.Item label="g" value="g" /><Picker.Item label="kg" value="kg" /><Picker.Item label="ml" value="ml" /><Picker.Item label="l" value="l" /><Picker.Item label="un" value="un" /></Picker></View>
              </View>
              <TouchableOpacity style={[styles.secondaryButton, isDarkMode && styles.secondaryButtonDark]} onPress={adicionarInsumo}><Text style={[styles.secondaryButtonText, isDarkMode && styles.secondaryButtonTextDark]}>Adicionar</Text></TouchableOpacity>
            </View>
          )}

          {insumos.map(item => (
            <View key={item.id} style={[styles.ingredientRow, isDarkMode && styles.ingredientRowDark]}>
              <View>
                <Text style={[styles.ingredientName, isDarkMode && styles.ingredientNameDark]}>{item.nome}</Text>
                <Text style={[styles.ingredientMeta, isDarkMode && styles.ingredientMetaDark]}>
                  {MAPA_UNIDADES[item.unidadeUsada] || 'Quantidade'} usadas: {item.qtdUsada}
                </Text>
              </View>
              <View style={styles.ingredientActions}>
                <Text style={[styles.ingredientValue, isDarkMode && styles.ingredientValueDark]}>
                  {formatMoney(custoInsumo(item))}
                </Text>
                <TouchableOpacity onPress={() => removerInsumo(item.id)}>
                  <Feather name="trash-2" size={18} color={isDarkMode ? '#fda4af' : '#ef4444'} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {insumos.length === 0 && <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>Nenhum ingrediente adicionado ainda.</Text>}
        </View>

        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons name="cog" size={18} color={isDarkMode ? '#93c5fd' : '#2563eb'} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Custos operacionais</Text>
            </View>
          </View>
          <View style={styles.toggleRow}>
            <TouchableOpacity onPress={() => setModoCusto('automatico')} style={[styles.modeButton, modoCusto === 'automatico' && styles.modeButtonActive, { marginRight: 10 }]}><Text style={[styles.modeLabel, modoCusto === 'automatico' && styles.modeLabelActive]}>Automático</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModoCusto('manual')} style={[styles.modeButton, modoCusto === 'manual' && styles.modeButtonActive, isDarkMode && modoCusto !== 'manual' && { backgroundColor: '#1e293b' }]}><Text style={[styles.modeLabel, modoCusto === 'manual' && styles.modeLabelActive, isDarkMode && modoCusto !== 'manual' && { color: '#ffffff' }]}>Manual</Text></TouchableOpacity>
          </View>
          {modoCusto === 'automatico' ? (
            <TextInput style={[styles.input, isDarkMode && styles.inputDark]} placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'} placeholder="Tempo de preparo (minutos)" keyboardType="numeric" value={tempoPreparo} onChangeText={text => setTempoPreparo(sanitizeNumber(text))} />
          ) : (
            <TextInput style={[styles.input, isDarkMode && styles.inputDark]} placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'} placeholder="Custo fixo (R$)" keyboardType="numeric" value={custoManual} onChangeText={text => setCustoManual(sanitizeNumber(text))} />
          )}
        </View>

        {(preview.custoTotal > 0 || isNaN(preview.custoTotal)) && (
          <View style={[styles.resultPreview, isDarkMode && styles.resultPreviewDark]}>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, isDarkMode && styles.resultLabelDark]}>Custo Total</Text>
              <Text style={[styles.resultValue, isDarkMode && styles.resultValueDark]}>
                {isNaN(preview.custoTotal) ? 'R$ 0,00' : formatMoney(preview.custoTotal)}
              </Text>
            </View>
            {(preview.precoSugeridoTotal > 0 || isNaN(preview.precoSugeridoTotal)) && (
              <>
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, isDarkMode && styles.resultLabelDark]}>Preço Sugerido</Text>
                  <Text style={[styles.resultHighlight, isDarkMode && styles.resultHighlightDark]}>
                    {isNaN(preview.precoSugeridoTotal) ? 'R$ 0,00' : formatMoney(preview.precoSugeridoTotal)}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, isDarkMode && styles.resultLabelDark]}>Lucro Líquido</Text>
                  <Text style={[styles.resultValue, preview.lucro >= 0 ? styles.profit : styles.loss]}>
                    {isNaN(preview.lucro) ? 'R$ 0,00' : formatMoney(Math.abs(preview.lucro))} {preview.lucro >= 0 ? '(Lucro)' : '(Prejuízo)'}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.buttonGroup}>
          {isEditing && (
            <TouchableOpacity style={[styles.cancelButton, isDarkMode && styles.cancelButtonDark, { marginRight: 10 }]} onPress={limparFormulario}><Text style={[styles.cancelButtonText, isDarkMode && styles.cancelButtonTextDark]}>Cancelar</Text></TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.saveButton, isDarkMode && styles.saveButtonDark]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{isEditing ? 'Atualizar' : 'Salvar'}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* MODAL INTELIGENTE DE IMPOSTOS POR ESTADO */}
      {/* ========================================================= */}
      {/* onRequestClose é obrigatório no Android: sem ele o botão físico Voltar
          não fechava o modal e o usuário ficava preso na lista de estados. */}
      <Modal
        visible={showTaxModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTaxModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Tributação por Estado</Text>
              <TouchableOpacity onPress={() => setShowTaxModal(false)}>
                <Feather name="x" size={24} color={isDarkMode ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, isDarkMode && styles.modalSubtitleDark]}>
              A sugestão soma a Alíquota Estadual Especial de alimentação + 3,65% dos impostos Federais (PIS/COFINS).
            </Text>
            
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {ESTADOS_TAXAS.map(estado => {
                const totalTax = (estado.taxa + FEDERAL_TAX).toFixed(2);
                return (
                  <TouchableOpacity
                    key={estado.uf}
                    style={[styles.stateItem, isDarkMode && styles.stateItemDark]}
                    onPress={() => {
                      // Substitui o ponto por vírgula para manter o padrão brasileiro no input
                      setImposto(totalTax.replace('.', ','));
                      setShowTaxModal(false);
                      onShowToast?.(`Imposto de ${totalTax}% sugerido para ${estado.uf}`, 'success');
                    }}
                  >
                    <View>
                      <Text style={[styles.stateName, isDarkMode && styles.stateNameDark]}>
                        {estado.nome} ({estado.uf})
                      </Text>
                      <Text style={[styles.stateTaxInfo, isDarkMode && styles.stateTaxInfoDark]}>
                        ICMS Alimentação: {estado.taxa}%
                      </Text>
                    </View>
                    <View style={styles.stateTotalBadge}>
                      <Text style={styles.stateTotalText}>{totalTax}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' }, screenDark: { backgroundColor: '#020617' },
  sectionCard: { marginBottom: 12, backgroundColor: '#ffffff', borderRadius: 28, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 18, elevation: 5 },
  sectionCardDark: { backgroundColor: '#111827' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' }, sectionTitleDark: { color: '#e2e8f0' },
  sectionSubtitle: { color: '#64748b', marginTop: 8, lineHeight: 20 }, sectionSubtitleDark: { color: '#94a3b8' },
  card: { backgroundColor: '#ffffff', borderRadius: 28, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 18, elevation: 5 },
  cardDark: { backgroundColor: '#111827' },
  label: { color: '#475569', fontWeight: '700', marginBottom: 8 }, labelDark: { color: '#94a3b8' },
  input: { height: 50, borderRadius: 18, paddingHorizontal: 16, marginBottom: 12, backgroundColor: '#f1f5f9', color: '#0f172a' }, inputDark: { backgroundColor: '#0f172a', color: '#e2e8f0' },
  
  // Estilos da nova barra de impostos
  taxInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  taxInput: { flex: 1, marginBottom: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  taxButton: { backgroundColor: '#2563eb', height: 50, paddingHorizontal: 16, borderTopRightRadius: 18, borderBottomRightRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  taxButtonDark: { backgroundColor: '#1d4ed8' },
  taxButtonText: { color: '#ffffff', fontWeight: '800', marginLeft: 6, fontSize: 14 },

  gridRow: { flexDirection: 'row' }, flex: { flex: 1 },
  pickerWrapper: { backgroundColor: '#f1f5f9', borderRadius: 18, marginBottom: 12, overflow: 'hidden' }, pickerWrapperDark: { backgroundColor: '#0f172a' },
  picker: { height: 50, color: '#0f172a' }, pickerDark: { color: '#e2e8f0' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  linkText: { color: '#2563eb', fontWeight: '700' }, linkTextDark: { color: '#93c5fd' },
  subCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 16, marginBottom: 16 }, subCardDark: { backgroundColor: '#111827' },
  smallLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 4 }, smallPicker: { height: 40, marginBottom: 8 },
  secondaryButton: { marginTop: 14, paddingVertical: 14, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center' }, secondaryButtonDark: { backgroundColor: '#1f2937' },
  secondaryButtonText: { color: '#2563eb', fontWeight: '800' }, secondaryButtonTextDark: { color: '#93c5fd' },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }, ingredientRowDark: { borderBottomColor: '#334155' },
  ingredientName: { fontWeight: '800', color: '#0f172a' }, ingredientNameDark: { color: '#e2e8f0' },
  ingredientMeta: { color: '#64748b', marginTop: 4, fontSize: 12 }, ingredientMetaDark: { color: '#94a3b8' },
  ingredientActions: { alignItems: 'flex-end' },
  ingredientValue: { fontWeight: '800', color: '#2563eb', marginBottom: 6 }, ingredientValueDark: { color: '#93c5fd' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 10 }, emptyTextDark: { color: '#94a3b8' },
  toggleRow: { flexDirection: 'row', marginBottom: 16 },
  modeButton: { flex: 1, paddingVertical: 14, borderRadius: 18, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' }, modeButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  modeLabel: { fontWeight: '800', color: '#0f172a' }, modeLabelActive: { color: '#ffffff' },
  resultPreview: { backgroundColor: '#2563eb', borderRadius: 28, padding: 20, marginBottom: 22 }, resultPreviewDark: { backgroundColor: '#1d4ed8' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  resultLabel: { fontSize: 13, fontWeight: '600', color: '#bfdbfe' }, resultLabelDark: { color: '#93c5fd' },
  resultValue: { fontSize: 16, fontWeight: '800', color: '#ffffff' }, resultValueDark: { color: '#e2e8f0' },
  resultHighlight: { fontSize: 20, fontWeight: '900', color: '#facc15' }, resultHighlightDark: { color: '#fde047' },
  profit: { color: '#bbf7d0' }, loss: { color: '#fecaca' },
  buttonGroup: { flexDirection: 'row', marginBottom: 20 },
  saveButton: { flex: 1, backgroundColor: '#2563eb', borderRadius: 24, paddingVertical: 16, alignItems: 'center' }, saveButtonDark: { backgroundColor: '#1d4ed8' },
  saveButtonText: { color: '#ffffff', fontWeight: '800' },
  cancelButton: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 24, paddingVertical: 16, alignItems: 'center' }, cancelButtonDark: { backgroundColor: '#1e293b' },
  cancelButtonText: { color: '#64748b', fontWeight: '800' }, cancelButtonTextDark: { color: '#94a3b8' },

  // Estilos do Modal de Impostos
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
  modalContentDark: { backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  modalTitleDark: { color: '#f8fafc' },
  modalSubtitle: { color: '#64748b', fontSize: 13, marginBottom: 16, lineHeight: 20 },
  modalSubtitleDark: { color: '#94a3b8' },
  modalList: { marginBottom: 20 },
  stateItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  stateItemDark: { borderBottomColor: '#1e293b' },
  stateName: { fontWeight: '800', color: '#334155', fontSize: 16 },
  stateNameDark: { color: '#e2e8f0' },
  stateTaxInfo: { color: '#64748b', fontSize: 13, marginTop: 4 },
  stateTaxInfoDark: { color: '#94a3b8' },
  stateTotalBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  stateTotalText: { color: '#2563eb', fontWeight: '900', fontSize: 15 }
});