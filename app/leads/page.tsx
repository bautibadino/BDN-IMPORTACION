"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { LeadForm } from "./components/lead-form"
import { PageHeader } from "@/app/components/page-header"
import { getProductLeadsAction, getSuppliersAction } from "./actions"
import type { ProductLead, Supplier } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

export default function ProductLeadsPage() {
  const [leads, setLeads] = useState<ProductLead[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([]) // Para el formulario
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<ProductLead | null>(null)
  const { toast } = useToast()
  const [dataVersion, setDataVersion] = useState(0)
  const refreshData = () => setDataVersion((v) => v + 1)

  useEffect(() => {
    async function loadData() {
      const [leadsData, suppliersData] = await Promise.all([getProductLeadsAction(), getSuppliersAction()])
      setLeads(leadsData)
      setSuppliers(suppliersData)
    }
    loadData()
  }, [dataVersion])

  const handleOpenDialog = (lead?: ProductLead) => {
    setEditingLead(lead || null)
    setIsDialogOpen(true)
  }
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingLead(null)
    refreshData()
  }
  // const handleDeleteLead = async (id: string) => { /* TODO */ }

  return (
    <>
      <PageHeader title="Leads de Producto">
        <Button size="sm" className="gap-1" onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-4 w-4" /> Nuevo Lead
        </Button>
      </PageHeader>
      <div className="border rounded-lg w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Precio Ref. (USD)</TableHead>
              <TableHead>MOQ</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const supplier = suppliers.find((s) => s.id === lead.supplierId)
              return (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    <Link href={`/leads/${lead.id}`} className="hover:underline">
                      {lead.name}
                    </Link>
                  </TableCell>
                  <TableCell>{supplier?.name || lead.supplierId}</TableCell>
                  <TableCell>{lead.category}</TableCell>
                  <TableCell className="text-right">
                    {lead.referencePriceUsd ? `$${lead.referencePriceUsd.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell>{lead.moq || "-"}</TableCell>
                  <TableCell>
                    {lead.tags?.split(",").map((tag) => (
                      <Badge key={tag} variant="outline" className="mr-1 mb-1">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/leads/${lead.id}`}>Ver Detalles</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDialog(lead)}>Editar</DropdownMenuItem>
                        {/* <DropdownMenuItem onClick={() => handleDeleteLead(lead.id)} className="text-red-600">Eliminar</DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <LeadForm lead={editingLead} suppliers={suppliers} onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </>
  )
}
