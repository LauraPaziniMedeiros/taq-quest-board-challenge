import { Button } from '@atomic/atm.button';
import { FaIcon } from '@atomic/atm.fa-icon';
import { H1 } from '@atomic/atm.typography';
import { Col, Row } from '@atomic/obj.grid';

interface QuestBoardHeaderProps {
  onCreateClick: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const QuestBoardHeader = ({ onCreateClick, isDarkMode, onToggleTheme }: QuestBoardHeaderProps) => (
  <Row cols={12} className="items-end">
    <Col sm={7}>
      <span className="font-secondary block text-[12px] tracking-[0.2em]" style={{ color: 'var(--ouro-escuro)' }}>
        TAQTILE · DESAFIO DE ESTÁGIO
      </span>
      <H1 className="font-secondary mt-xs mb-0 text-[40px] leading-[1.05] font-bold tracking-[0.02em]">
        Quadro da Guilda
      </H1>
    </Col>
    <Col sm={5} className="flex justify-end">
      <div className="flex flex-wrap justify-end gap-sm">
        <button
          type="button"
          aria-pressed={isDarkMode}
          aria-label={`Ativar tema ${isDarkMode ? 'claro' : 'escuro'}`}
          onClick={onToggleTheme}
          className="font-secondary focus-visible:ring-primary border-neutral-strong bg-neutral-xxsoft text-neutral-strong rounded-[4px] border px-md py-xs text-sm font-semibold tracking-[0.06em] transition focus-visible:ring-2 focus-visible:outline-none">
          Tema {isDarkMode ? 'claro' : 'escuro'}
        </button>
        <Button variant="cta" onClick={onCreateClick} className="shrink-0">
          <FaIcon.StepperPlus />
          Nova missão
        </Button>
      </div>
    </Col>
  </Row>
);
