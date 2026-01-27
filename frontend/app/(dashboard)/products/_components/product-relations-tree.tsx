'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight, ChevronDown, Package, Calculator } from 'lucide-react';
import { QuantityTypeBadge } from './quantity-type-badge';
import type { Product, ProductRelation } from '@/lib/types';

interface ProductRelationsTreeProps {
  product: Product;
}

interface TreeNode {
  relation: ProductRelation;
  relatedProduct: Product;
  children: TreeNode[];
  calculatedQuantity: number;
  level: number;
}

export function ProductRelationsTree({ product }: ProductRelationsTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([product.id!]));
  const [baseQuantity, setBaseQuantity] = useState<number>(1);
  const [showCalculations, setShowCalculations] = useState<boolean>(true);

  // Fetch relations for the main product
  const { data: relationsData, isLoading } = useQuery({
    queryKey: ['product-relations-tree', product.id, baseQuantity],
    queryFn: async () => {
      return await buildTreeRecursive(product.id!, baseQuantity, 0, new Set());
    },
    enabled: !!product.id,
  });

  const toggleNode = (productId: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    if (!relationsData) return;
    const allIds = new Set<number>([product.id!]);
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.relatedProduct.id!);
        if (node.children.length > 0) {
          collectIds(node.children);
        }
      });
    };
    collectIds(relationsData);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set([product.id!]));
  };

  // Calculate tree statistics
  const treeStats = relationsData ? calculateTreeStats(relationsData) : null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Albero Relazioni</CardTitle>
          <CardDescription>Visualizzazione gerarchica delle relazioni prodotto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Caricamento albero...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!relationsData || relationsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Albero Relazioni</CardTitle>
          <CardDescription>Visualizzazione gerarchica delle relazioni prodotto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessuna relazione configurata</p>
            <p className="text-sm mt-2">Aggiungi relazioni per vedere l&apos;albero gerarchico</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Albero Relazioni</CardTitle>
            <CardDescription>
              Visualizzazione gerarchica con calcolo quantità per {product.name}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Comprimi Tutto
            </Button>
            <Button variant="outline" size="sm" onClick={expandAll}>
              Espandi Tutto
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex items-end gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex-1 max-w-xs space-y-2">
            <Label htmlFor="baseQuantity">Quantità Base Prodotto</Label>
            <div className="flex items-center gap-2">
              <Input
                id="baseQuantity"
                type="number"
                min="1"
                step="1"
                value={baseQuantity}
                onChange={(e) => setBaseQuantity(parseInt(e.target.value) || 1)}
                className="w-32"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">× {product.unit}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Modifica per vedere come cambiano le quantità
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-slate-500" />
            <Label htmlFor="showCalculations" className="cursor-pointer">
              Mostra Calcoli
            </Label>
            <input
              id="showCalculations"
              type="checkbox"
              checked={showCalculations}
              onChange={(e) => setShowCalculations(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Tree Statistics */}
        {treeStats && (
          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span><strong>{treeStats.totalNodes}</strong> prodotti</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Profondità: <strong>{treeStats.maxDepth}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <span>Relazioni: <strong>{treeStats.totalRelations}</strong></span>
            </div>
          </div>
        )}

        {/* Tree */}
        <div className="space-y-1">
          {/* Root node */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 flex-1">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">{product.name}</span>
              <Badge variant="outline">{product.code}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {baseQuantity} {product.unit}
              </span>
            </div>
          </div>

          {/* Children */}
          {relationsData.map((node, index) => (
            <TreeNodeComponent
              key={node.relation.id || index}
              node={node}
              expanded={expandedNodes.has(node.relatedProduct.id!)}
              onToggle={toggleNode}
              showCalculations={showCalculations}
              baseQuantity={baseQuantity}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Legenda:</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900 border-2 border-blue-300 dark:border-blue-700 rounded"></div>
              <span className="text-slate-600 dark:text-slate-400">Prodotto Principale</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"></div>
              <span className="text-slate-600 dark:text-slate-400">Relazione</span>
            </div>
            <QuantityTypeBadge type="fixed" size="sm" />
            <QuantityTypeBadge type="multiplied" size="sm" />
            <QuantityTypeBadge type="formula" size="sm" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for rendering tree nodes
interface TreeNodeComponentProps {
  node: TreeNode;
  expanded: boolean;
  onToggle: (id: number) => void;
  showCalculations: boolean;
  baseQuantity: number;
}

function TreeNodeComponent({ node, expanded, onToggle, showCalculations, baseQuantity }: TreeNodeComponentProps) {
  const hasChildren = node.children.length > 0;
  const indent = node.level * 32; // 32px per level for better spacing

  return (
    <div>
      <div
        className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors relative"
        style={{ marginLeft: `${indent}px` }}
      >
        {/* Level indicator line */}
        {node.level > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800"
            style={{ left: `${indent - 16}px` }}
          />
        )}

        {/* Expand/Collapse button */}
        <button
          onClick={() => hasChildren && onToggle(node.relatedProduct.id!)}
          className={`flex-shrink-0 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
            !hasChildren ? 'invisible' : ''
          }`}
          disabled={!hasChildren}
          aria-label={expanded ? 'Comprimi' : 'Espandi'}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {/* Level badge */}
        {node.level > 0 && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-medium text-slate-600 dark:text-slate-400">
            L{node.level}
          </div>
        )}

        {/* Product info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Package className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
            {node.relatedProduct.name}
          </span>
          <Badge variant="outline" className="flex-shrink-0 text-xs">
            {node.relatedProduct.code}
          </Badge>
          {hasChildren && (
            <Badge variant="secondary" className="flex-shrink-0 text-[10px] px-1.5 py-0">
              {node.children.length} sub
            </Badge>
          )}
        </div>

        {/* Quantity calculation */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <QuantityTypeBadge type={node.relation.quantity_type} size="sm" />

          {showCalculations && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {getCalculationDisplay(node.relation, baseQuantity)}
            </span>
          )}

          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 min-w-[80px] text-right">
            {node.calculatedQuantity.toFixed(2)} {node.relatedProduct.unit}
          </span>
        </div>
      </div>

      {/* Children (recursive) */}
      {expanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children.map((childNode, index) => (
            <TreeNodeComponent
              key={childNode.relation.id || `${childNode.relatedProduct.id}-${index}`}
              node={childNode}
              expanded={expanded}
              onToggle={onToggle}
              showCalculations={showCalculations}
              baseQuantity={node.calculatedQuantity}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions
async function buildTreeRecursive(
  productId: number,
  parentQuantity: number,
  level: number,
  visited: Set<number>,
  maxDepth: number = 5
): Promise<TreeNode[]> {
  // Prevent infinite recursion and circular dependencies
  if (level >= maxDepth || visited.has(productId)) {
    return [];
  }

  visited.add(productId);

  try {
    const relations = await productsApi.getRelations(productId);

    if (relations.length === 0) {
      return [];
    }

    // Fetch all related products in parallel
    const relatedProductsPromises = relations.map((rel: ProductRelation) =>
      productsApi.getById(rel.related_product_id)
    );
    const relatedProducts = await Promise.all(relatedProductsPromises);

    // Build tree nodes with recursive children
    const treeNodes: TreeNode[] = [];

    for (let i = 0; i < relations.length; i++) {
      const relation = relations[i];
      const relatedProduct = relatedProducts[i];
      const calculatedQuantity = calculateQuantity(relation, parentQuantity);

      // Recursively fetch children (if any)
      const children = await buildTreeRecursive(
        relatedProduct.id!,
        calculatedQuantity,
        level + 1,
        new Set(visited) // Pass copy to avoid polluting parent's visited set
      );

      treeNodes.push({
        relation,
        relatedProduct,
        children,
        calculatedQuantity,
        level,
      });
    }

    return treeNodes;
  } catch (error) {
    console.error('Error building tree for product', productId, error);
    return [];
  }
}

function calculateQuantity(relation: ProductRelation, parentQuantity: number): number {
  switch (relation.quantity_type) {
    case 'fixed':
      return parseFloat(relation.quantity_value);

    case 'multiplied':
      return parseFloat(relation.quantity_value) * parentQuantity;

    case 'formula':
      try {
        // Use Function constructor for safer evaluation
        // The formula should contain 'qty' as variable (e.g., "ceil(qty/6)")
        // We provide Math functions in scope (ceil, floor, round, etc.)
        const fn = new Function(
          'qty',
          'ceil',
          'floor',
          'round',
          'min',
          'max',
          'abs',
          `return ${relation.quantity_value}`
        );
        return fn(
          parentQuantity,
          Math.ceil,
          Math.floor,
          Math.round,
          Math.min,
          Math.max,
          Math.abs
        );
      } catch (error) {
        console.error('Formula evaluation error:', error, 'Formula:', relation.quantity_value);
        return 0;
      }

    default:
      return 0;
  }
}

function getCalculationDisplay(relation: ProductRelation, parentQuantity: number): string {
  switch (relation.quantity_type) {
    case 'fixed':
      return `= ${relation.quantity_value}`;

    case 'multiplied':
      return `${relation.quantity_value} × ${parentQuantity}`;

    case 'formula':
      return `${relation.quantity_value}`;

    default:
      return '';
  }
}

function calculateTreeStats(nodes: TreeNode[]): { totalNodes: number; maxDepth: number; totalRelations: number } {
  let totalNodes = 0;
  let maxDepth = 0;
  let totalRelations = 0;

  function traverse(node: TreeNode, depth: number) {
    totalNodes++;
    totalRelations++;
    maxDepth = Math.max(maxDepth, depth);

    if (node.children.length > 0) {
      node.children.forEach(child => traverse(child, depth + 1));
    }
  }

  nodes.forEach(node => traverse(node, 1));

  return { totalNodes, maxDepth, totalRelations };
}
