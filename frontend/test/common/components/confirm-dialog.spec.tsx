import ConfirmDialog from '@/common/components/confirm-dialog';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

type Overrides = Partial<Parameters<typeof ConfirmDialog>[0]>;

const renderDialog = (overrides: Overrides = {}) => {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      open
      title="Pay $6.00?"
      body="This records the payment."
      confirmLabel="Pay"
      error=""
      loading={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
      testIdPrefix="pay"
      {...overrides}
    />,
  );
  return { onCancel, onConfirm };
};

describe('ConfirmDialog', () => {
  it('renders the title, body and confirm label', () => {
    renderDialog();

    expect(screen.getByTestId('pay-dialog')).toHaveTextContent('Pay $6.00?');
    expect(screen.getByTestId('pay-dialog')).toHaveTextContent('This records the payment.');
    expect(screen.getByTestId('pay-confirm')).toHaveTextContent('Pay');
    expect(screen.queryByTestId('pay-error')).not.toBeInTheDocument();
  });

  it('calls cancel and confirm', async () => {
    const { onCancel, onConfirm } = renderDialog();

    await userEvent.click(screen.getByTestId('pay-cancel'));
    await userEvent.click(screen.getByTestId('pay-confirm'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows the error', () => {
    renderDialog({ error: 'Nothing to pay' });

    expect(screen.getByTestId('pay-error')).toHaveTextContent('Nothing to pay');
  });

  it('disables the confirm button while loading', () => {
    renderDialog({ loading: true });

    expect(screen.getByTestId('pay-confirm')).toBeDisabled();
  });

  it('renders nothing when closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByTestId('pay-dialog')).not.toBeInTheDocument();
  });
});
