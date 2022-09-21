import { ReactNode } from 'react';
import {
  MessageType,
  CollapsibleProps
} from '../components/common';

export interface ModalInfo {
  title: string | ReactNode;
  type: MessageType;
  body?: string | ReactNode;
  collapsible?: CollapsibleProps;
}

