import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SubmitTipModal from './SubmitTipModal';
import './PlusTipButton.css';

/**
 * Floating "+" button shown only for SENIOR users.
 * Clicking it opens a mail-style tip submission modal.
 *
 * @param {Function} onTipSuccess - Called after a tip is successfully submitted,
 *                                   so the feed can refresh.
 */
export default function PlusTipButton({ onTipSuccess }) {
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  // Only show for SENIOR users
  if (!user || user.role !== 'SENIOR') return null;

  return (
    <>
      <button
        className="plus-tip-btn"
        onClick={() => setShowModal(true)}
        title="Add a Tip"
      >
        +
      </button>

      <SubmitTipModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={onTipSuccess}
      />
    </>
  );
}
