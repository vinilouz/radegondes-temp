import React from "react";
import { useEffect, useRef } from 'react';


function AbaTimers({ topico, timersTopicos, setTimersTopicos, setTempoEstudoTimer, onPause, obterUltimoTempoTopico }) {
  // Armazenar o intervalId fora do estado para evitar conflitos
  const intervalRef = useRef(null);

  console.log(topico, timersTopicos, setTimersTopicos, setTempoEstudoTimer, onPause, obterUltimoTempoTopico);
  console.log('------------------------------------------------------------------');

  // Função auxiliar para encontrar timer do tópico (mesma lógica do componente principal)
  const encontrarTimerTopico = (topico) => {
    // Primeiro, tentar a chave direta
    if (timersTopicos[topico]) {
      return { timer: timersTopicos[topico], chave: topico };
    }

    // Buscar por chaves únicas que contenham o tópico
    const chavesRelacionadas = Object.keys(timersTopicos).filter(chave =>
      chave.startsWith(`${topico}-`) && chave.match(new RegExp(`^${topico.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d+$`))
    );

    if (chavesRelacionadas.length > 0) {
      // Se houver múltiplas chaves, retornar a que está ativa ou a primeira
      const chaveAtiva = chavesRelacionadas.find(chave => timersTopicos[chave]?.ativo);
      if (chaveAtiva) {
        return { timer: timersTopicos[chaveAtiva], chave: chaveAtiva };
      }

      // Senão, retornar a primeira encontrada
      return { timer: timersTopicos[chavesRelacionadas[0]], chave: chavesRelacionadas[0] };
    }

    // Fallback: timer vazio
    return { timer: { tempo: 0, ativo: false, finalizado: false }, chave: topico };
  };

  // Obter estado do timer para este tópico específico
  const { timer: timerTopico, chave: chaveTimer } = encontrarTimerTopico(topico);

  // Atualizar tempoEstudoTimer sempre que o timer do tópico mudar
  useEffect(() => {
    setTempoEstudoTimer(timerTopico.tempo);
  }, [timerTopico.tempo, setTempoEstudoTimer]);

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  // Função para limpar interval ativo
  const limparInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Interval limpo para AbaTimers:', topico);
    }
  };

  const iniciarTimer = () => {
      console.log(topico, timersTopicos, setTimersTopicos, setTempoEstudoTimer, onPause, obterUltimoTempoTopico);

    // Limpar qualquer interval ativo
    limparInterval();

    // Obter último tempo do histórico se o timer estiver zerado
    let tempoInicial = timerTopico.tempo;
    if (tempoInicial === 0 && obterUltimoTempoTopico) {
      tempoInicial = obterUltimoTempoTopico(topico);
    }

    // Pausar todos os outros timers antes de iniciar este
    setTimersTopicos(prev => {
      const novosTimers = {};
      // Pausar todos os timers
      Object.keys(prev).forEach(key => {
        novosTimers[key] = { ...prev[key], ativo: false };
      });
      // Ativar apenas o timer atual usando a chave correta
      novosTimers[chaveTimer] = { ...timerTopico, tempo: tempoInicial, ativo: true };
      return novosTimers;
    });

    // Criar novo interval
    intervalRef.current = setInterval(() => {
      setTimersTopicos(prev => ({
        ...prev,
        [chaveTimer]: {
          ...prev[chaveTimer],
          tempo: (prev[chaveTimer]?.tempo || 0) + 1
        }
      }));
    }, 1000);
  };

  const pausarTimer = async () => {
    console.log('Pausando timer na AbaTimers para:', topico, 'chave:', chaveTimer);

    // Limpar interval primeiro
    limparInterval();

    // Pausar timer para este tópico usando a chave correta
    setTimersTopicos(prev => {
      const novoEstado = {
        ...prev,
        [chaveTimer]: { ...prev[chaveTimer], ativo: false }
      };
      console.log('Estado atualizado na AbaTimers:', novoEstado);
      return novoEstado;
    });

    // Chamar função de salvamento automático se fornecida
    if (onPause && typeof onPause === 'function') {
      try {
        await onPause(topico, chaveTimer);
        console.log('Salvamento automático executado na AbaTimers para:', topico);
      } catch (error) {
        console.error('Erro no salvamento automático na AbaTimers:', error);
      }
    }
  };

  const resetarTimer = () => {
    // Limpar interval
    limparInterval();

    // Resetar timer para este tópico usando a chave correta
    setTimersTopicos(prev => ({
      ...prev,
      [chaveTimer]: { tempo: 0, ativo: false, finalizado: false }
    }));
  };

  // Cleanup quando componente desmonta
  useEffect(() => {
    return () => {
      limparInterval();
    };
  }, []);

  // Restaurar timer ativo quando página carrega
  useEffect(() => {
    if (timerTopico.ativo && !intervalRef.current) {
      console.log('Restaurando timer ativo na AbaTimers para:', topico);
      intervalRef.current = setInterval(() => {
        setTimersTopicos(prev => ({
          ...prev,
          [chaveTimer]: {
            ...prev[chaveTimer],
            tempo: (prev[chaveTimer]?.tempo || 0) + 1
          }
        }));
      }, 1000);
    } else if (!timerTopico.ativo && intervalRef.current) {
      // Se o timer não está ativo mas ainda tem interval, limpar
      limparInterval();
    }
  }, [timerTopico.ativo, chaveTimer, topico]);

  // Parar timer se não está mais ativo
  useEffect(() => {
    if (!timerTopico.ativo && intervalRef.current) {
      console.log('Parando timer inativo na AbaTimers para:', topico);
      limparInterval();
    }
  }, [timerTopico.ativo, topico]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Cabeçalho minimalista */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="var(--orange-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          margin: 0
        }}>
          Timer de Estudo - {topico}
        </h4>
      </div>

      {/* Timer Único - Design simplificado */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        backgroundColor: timerTopico.ativo ? 'rgba(245, 158, 11, 0.1)' : 'var(--darkmode-bg-tertiary)',
        borderRadius: '12px',
        border: `2px solid ${timerTopico.ativo ? 'var(--orange-primary)' : 'var(--darkmode-border-secondary)'}`,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Display do Timer - Maior */}
          <div style={{
            fontSize: '48px',
            fontWeight: '700',
            color: timerTopico.ativo ? 'var(--orange-primary)' : 'var(--darkmode-text-primary)',
            fontFamily: 'monospace',
            textAlign: 'center',
            textShadow: timerTopico.ativo ? '0 0 15px rgba(245, 158, 11, 0.4)' : 'none',
            letterSpacing: '2px'
          }}>
            {formatarTempo(timerTopico.tempo)}
          </div>

          {/* Botões de Controle */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            {!timerTopico.ativo ? (
              <button
                onClick={iniciarTimer}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'var(--darkmode-button-success)',
                  color: 'var(--darkmode-bg-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ▶ Iniciar
              </button>
            ) : (
              <button
                onClick={pausarTimer}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#F59E0B',
                  color: 'var(--darkmode-bg-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ⏸ Pausar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Informações do Timer */}
      <div style={{
        padding: '12px',
        backgroundColor: 'var(--darkmode-bg-tertiary)',
        borderRadius: '6px',
        border: '1px solid var(--darkmode-border-secondary)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '12px',
          color: 'var(--darkmode-text-secondary)',
          marginBottom: '4px'
        }}>
          Status do Timer
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: timerTopico.ativo ? 'var(--orange-primary)' : 'var(--darkmode-text-primary)'
        }}>
          {timerTopico.ativo ? 'Em execução' : 'Parado'}
        </div>
      </div>
    </div>
  );
}

export default AbaTimers;