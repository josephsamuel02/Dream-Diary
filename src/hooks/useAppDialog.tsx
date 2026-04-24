import React, { useState, useCallback } from 'react';
import AppDialog, { DialogButton } from '~/components/AppDialog';

type DialogConfig = {
  title: string;
  message?: string;
  buttons?: DialogButton[];
};

/**
 * Drop-in replacement for React Native's Alert.alert.
 *
 * Usage:
 *   const { showDialog, dialogElement } = useAppDialog();
 *   // render {dialogElement} somewhere in your JSX
 *   showDialog({ title: 'Delete?', message: '...', buttons: [...] });
 */
export function useAppDialog() {
  const [config, setConfig] = useState<DialogConfig | null>(null);

  const dismiss = useCallback(() => setConfig(null), []);

  const showDialog = useCallback((cfg: DialogConfig) => {
    setConfig({
      ...cfg,
      buttons: cfg.buttons?.map((btn) => ({
        ...btn,
        onPress: () => {
          dismiss();
          btn.onPress?.();
        },
      })) ?? [{ text: 'OK', onPress: dismiss }],
    });
  }, [dismiss]);

  const dialogElement = (
    <AppDialog
      visible={!!config}
      title={config?.title ?? ''}
      message={config?.message}
      buttons={config?.buttons}
      onDismiss={dismiss}
    />
  );

  return { showDialog, dialogElement };
}
