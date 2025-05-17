"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/auth"
import type { Contact, ContactFormData } from "@/lib/types"
import { ContactsTable } from "@/components/contacts/contacts-table"
import { AddContactDialog } from "@/components/contacts/add-contact-dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, LogOut, RefreshCw } from "lucide-react"

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningScheduler, setIsRunningScheduler] = useState(false)
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login")
      } else {
        fetchContacts()
      }
    }
  }, [isAuthenticated, authLoading, router])

  const fetchContacts = async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/api/contacts")
      setContacts(response.data)
    } catch (error: any) {
      console.error("Error fetching contacts:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch contacts",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddContact = async (contactData: ContactFormData) => {
    try {
      await api.post("/api/contacts", contactData)
      fetchContacts()
      toast({
        title: "Success",
        description: "Contact added successfully",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to add contact",
      })
      throw error
    }
  }

  const handleDeleteContact = async (id: string) => {
    try {
      await api.delete(`/api/contacts/${id}`)
      fetchContacts()
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to delete contact",
      })
    }
  }

  const handleRunScheduler = async () => {
    setIsRunningScheduler(true)
    try {
      await api.post("/run-scheduler")
      toast({
        title: "Success",
        description: "Scheduler completed successfully",
      })
      fetchContacts()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to run scheduler",
      })
    } finally {
      setIsRunningScheduler(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-3xl font-bold tracking-tight">Networking Contacts</h1>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <AddContactDialog onAddContact={handleAddContact} />
          <Button variant="outline" onClick={handleRunScheduler} disabled={isRunningScheduler}>
            {isRunningScheduler ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Scheduler
              </>
            )}
          </Button>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      <ContactsTable
        contacts={contacts}
        isLoading={isLoading}
        onDeleteContact={handleDeleteContact}
      />
    </div>
  )
}
