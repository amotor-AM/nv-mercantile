"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Phone, Shield } from "lucide-react"

export function ProfileSettings() {
  const { user, isLoaded } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.emailAddresses[0]?.emailAddress || "",
    phone: user?.phoneNumbers[0]?.phoneNumber || "",
    newsletter: true,
    smsUpdates: false,
  })

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      await user?.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      setIsEditing(false)
      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.emailAddresses[0]?.emailAddress || "",
      phone: user?.phoneNumbers[0]?.phoneNumber || "",
      newsletter: true,
      smsUpdates: false,
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={formData.email} disabled={true} className="pl-10 bg-muted" />
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed here. Use your account settings.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="phone" type="tel" value={formData.phone} disabled={true} className="pl-10 bg-muted" />
            </div>
            <p className="text-xs text-muted-foreground">Phone number is managed through your account settings.</p>
          </div>
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Communication Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="newsletter"
              checked={formData.newsletter}
              onCheckedChange={(checked) => handleInputChange("newsletter", checked as boolean)}
              disabled={!isEditing}
            />
            <Label htmlFor="newsletter">Email me about Nike products, offers, and Member benefits</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="smsUpdates"
              checked={formData.smsUpdates}
              onCheckedChange={(checked) => handleInputChange("smsUpdates", checked as boolean)}
              disabled={!isEditing}
            />
            <Label htmlFor="smsUpdates">Send me SMS updates about my orders and Nike products</Label>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">Managed through your Clerk account</p>
            </div>
            <Button variant="outline" onClick={() => window.open("/account", "_blank")}>
              Manage
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline" onClick={() => window.open("/account", "_blank")}>
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
