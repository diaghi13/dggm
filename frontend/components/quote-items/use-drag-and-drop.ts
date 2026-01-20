import { useState } from 'react';
import { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { QuoteItem } from './types';
import { findItem, removeItem } from './utils';

export const useDragAndDrop = (
  localItems: QuoteItem[],
  setLocalItems: (items: QuoteItem[]) => void,
  expandedItems: Set<number>,
  setExpandedItems: (items: Set<number>) => void
) => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState<{ y: number } | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as number | null);
    if (event.delta) {
      setDragPosition({ y: event.delta.y });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);
    setDragPosition(null);

    if (!over || active.id === over.id) return;

    const activeItem = findItem(localItems, active.id as number);
    const overItem = findItem(localItems, over.id as number);

    if (!activeItem || !overItem) return;

    console.log('Drag:', {
      active: { id: activeItem.id, type: activeItem.type, parent: activeItem.parent_id },
      over: { id: overItem.id, type: overItem.type, parent: overItem.parent_id },
      dragPosition
    });

    // CASO 1: Sezione → Sezione (riordina)
    if (activeItem.type === 'section' && overItem.type === 'section') {
      console.log('CASO 1: Sezione → Sezione (riordina)');
      const oldIndex = localItems.findIndex((item) => item.id === active.id);
      const newIndex = localItems.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newItems = arrayMove(localItems, oldIndex, newIndex).map((item, index) => ({
        ...item,
        sort_order: index,
      }));

      setLocalItems(newItems);
      return;
    }

    // CASO 2: Voce → Sezione espansa (inserisci dentro)
    if (activeItem.type !== 'section' && overItem.type === 'section') {
      const sectionIsExpanded = expandedItems.has(overItem.id);
      const sectionHasChildren = overItem.children && overItem.children.length > 0;

      if (sectionIsExpanded && sectionHasChildren) {
        console.log('CASO 2: Voce → Sezione espansa (inserisci dentro)');
        let newItems = removeItem(localItems, activeItem.id);

        const itemToAdd = {
          ...activeItem,
          parent_id: overItem.id,
        };

        newItems = newItems.map(item => {
          if (item.id === overItem.id) {
            return {
              ...item,
              children: [...(item.children || []), itemToAdd],
            };
          }
          return item;
        });

        setExpandedItems(new Set([...expandedItems, overItem.id]));
        setLocalItems(newItems);
        return;
      }
    }

    // CASO 3: Stesso parent (riordina)
    if (activeItem.parent_id === overItem.parent_id) {
      console.log('CASO 3: Stesso parent (riordina)');

      if (activeItem.parent_id === null) {
        const oldIndex = localItems.findIndex(item => item.id === active.id);
        const newIndex = localItems.findIndex(item => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const newItems = arrayMove(localItems, oldIndex, newIndex).map((item, index) => ({
          ...item,
          sort_order: index,
        }));

        setLocalItems(newItems);
      } else {
        const newItems = localItems.map(item => {
          if (item.id === activeItem.parent_id && item.children) {
            const oldIndex = item.children.findIndex(c => c.id === active.id);
            const newIndex = item.children.findIndex(c => c.id === over.id);

            if (oldIndex === -1 || newIndex === -1) return item;

            return {
              ...item,
              children: arrayMove(item.children, oldIndex, newIndex),
            };
          }
          return item;
        });

        setLocalItems(newItems);
      }
      return;
    }

    // CASO 4: Estrai voce da sezione
    if (activeItem.type !== 'section' && activeItem.parent_id !== null &&
        overItem.type !== 'section' && overItem.parent_id === null) {
      console.log('CASO 4: Estrai voce dalla sezione al root level');
      const newItems = removeItem(localItems, activeItem.id);

      const itemToAdd = {
        ...activeItem,
        parent_id: null,
      };

      const overIndex = newItems.findIndex(item => item.id === over.id);
      newItems.splice(overIndex + 1, 0, itemToAdd);

      setLocalItems(newItems);
      return;
    }

    // CASO 5: Parent diversi (sposta)
    console.log('CASO 5: Parent diversi (sposta)');
    let newItems = removeItem(localItems, activeItem.id);

    const itemToAdd = {
      ...activeItem,
      parent_id: overItem.parent_id,
    };

    if (overItem.parent_id === null) {
      const overIndex = newItems.findIndex(item => item.id === over.id);
      newItems.splice(overIndex + 1, 0, itemToAdd);
    } else {
      newItems = newItems.map(item => {
        if (item.id === overItem.parent_id && item.children) {
          const overIndex = item.children.findIndex(c => c.id === over.id);
          const newChildren = [...item.children];
          newChildren.splice(overIndex + 1, 0, itemToAdd);
          return {
            ...item,
            children: newChildren,
          };
        }
        return item;
      });
    }

    setLocalItems(newItems);
  };

  return {
    activeId,
    overId,
    dragPosition,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};

