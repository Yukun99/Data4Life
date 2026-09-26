import MergeDialog from '@/pages/catalogue/components/merge-dialog';
import useMergeDialog from '@/pages/catalogue/hooks/use-merge-dialog';
import { Conflict } from '@/pages/catalogue/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import mockFetch from '../../../mock-fetch';
import withStore from '../../../with-store';

const english = { id: 1, name: 'English' };
const french = { id: 2, name: 'French' };
const fantasy = { id: 5, name: 'Fantasy' };

const conflict: Conflict = {
  sourceIsbn: '111',
  source: {
    isbn: '222',
    title: 'Dune ',
    author: 'Frank Herbert',
    genre: fantasy,
    language: english,
    amount: '3',
  },
  sourceOnLoan: 1,
  target: {
    isbn: '222',
    title: 'Dune',
    author: 'F. Herbert',
    genre: fantasy,
    language: french,
    amount: 4,
    stock: 2,
  },
};

const Harness = ({ onMerged }: { onMerged: () => void }) => {
  const merge = useMergeDialog({ onMerged });
  return (
    <>
      <button onClick={() => merge.start(conflict)}>start</button>
      <MergeDialog
      conflict={merge.conflict}
      differing={merge.differing}
      choices={merge.choices}
      onChoose={merge.choose}
      custom={merge.custom}
      onCustomChange={merge.setCustom}
      amount={merge.amount}
      onAmountChange={merge.setAmount}
      stockAfter={merge.stockAfter}
      genres={[fantasy]}
      languages={[english, french]}
      error={merge.error}
      saving={merge.saving}
      onCancel={merge.cancel}
      onConfirm={merge.confirm}
      />
    </>
  );
};

const renderHarness = async () => {
  const onMerged = vi.fn();
  const { ui } = withStore(<Harness onMerged={onMerged} />);
  render(ui);
  await userEvent.click(screen.getByText('start'));
  return onMerged;
};

describe('MergeDialog', () => {
  it('shows only the fields that differ and sums the amounts', async () => {
    mockFetch({});
    await renderHarness();

    expect(await screen.findByTestId('merge-message')).toHaveTextContent(
      'ISBN 222 already exists. Choose values for the merged book.',
    );
    expect(screen.queryByTestId('merge-title')).not.toBeInTheDocument();
    expect(screen.queryByTestId('merge-genre')).not.toBeInTheDocument();
    expect(screen.getByTestId('merge-author')).toBeInTheDocument();
    expect(screen.getByTestId('merge-language')).toBeInTheDocument();
    expect(screen.getByTestId('merge-amount-input')).toHaveValue('7');
    expect(screen.getByTestId('merge-stock')).toHaveTextContent('Stock after merge: 4');
  });

  it('sends the chosen and custom values', async () => {
    const fetchMock = mockFetch({
      'POST /api/books/111/merge': { status: 200, body: conflict.target },
    });
    const onMerged = await renderHarness();

    await userEvent.click(await screen.findByTestId('merge-author-custom'));
    await userEvent.type(screen.getByTestId('merge-author-input'), 'Herbert, Frank');
    await userEvent.click(screen.getByTestId('merge-language-target'));
    await userEvent.clear(screen.getByTestId('merge-amount-input'));
    await userEvent.type(screen.getByTestId('merge-amount-input'), '6');
    await userEvent.click(screen.getByTestId('merge-confirm'));

    expect(onMerged).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/books/111/merge',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          isbn: '222',
          title: 'Dune',
          author: 'Herbert, Frank',
          genreId: 5,
          languageId: 2,
          amount: 6,
        }),
      }),
    );
  });

  it('rejects an amount below the copies on loan', async () => {
    const fetchMock = mockFetch({});
    await renderHarness();

    await userEvent.clear(await screen.findByTestId('merge-amount-input'));
    await userEvent.type(screen.getByTestId('merge-amount-input'), '2');
    await userEvent.click(screen.getByTestId('merge-confirm'));

    expect(screen.getByTestId('merge-error')).toHaveTextContent('at least 3');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
