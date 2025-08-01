import {
  AbstractAuthModuleProvider,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  AuthenticationInput,
  AuthIdentityProviderService,
  AuthenticationResponse,
  Logger,
} from "@medusajs/types";
import { Twilio } from "twilio";

type InjectedDependencies = {
  logger: Logger;
};

type Options = {
  accountSid: string;
  authToken: string;
  serviceSid: string;
};

class PhoneAuthService extends AbstractAuthModuleProvider {
  static DISPLAY_NAME = "Phone Auth (Twilio Verify)";
  static identifier = "phone-auth";
  private logger: Logger;
  private client: Twilio;
  private serviceSid: string;

  constructor(container: InjectedDependencies, options: Options) {
    super();
    this.logger = container.logger;
    this.client = new Twilio(options.accountSid, options.authToken);
    this.serviceSid = options.serviceSid;
  }

  static validateOptions(options: Record<string, any>): void | never {
    if (!options.accountSid) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "TWILIO_ACCOUNT_SID is required"
      );
    }
    if (!options.authToken) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "TWILIO_AUTH_TOKEN is required"
      );
    }
    if (!options.serviceSid) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "TWILIO_SERVICE_SID is required"
      );
    }
  }

  /** Paso 1: registrar (igual que antes) */
  async register(
    data: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const { phone } = data.body || {};
    if (!phone) {
      return { success: false, error: "Phone number is required" };
    }
    try {
      const test = await authIdentityService.retrieve({ entity_id: phone });
      return { success: false, error: "User already exists" };
    } catch {
      const user = await authIdentityService.create({ entity_id: phone });
      return { success: true, authIdentity: user };
    }
  }

  /** Paso 2: enviar OTP vía Verify */
  async authenticate(
    data: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const { phone } = data.body || {};
    if (!phone) {
      return { success: false, error: "Phone number is required" };
    }
    // comprueba que el usuario exista
    try {
      await authIdentityService.retrieve({ entity_id: phone });
    } catch {
      return { success: false, error: "User does not exist" };
    }
    // llama a Twilio Verify para enviar el OTP
    await this.client.verify.v2.services(this.serviceSid).verifications.create({
      to: phone,
      channel: "sms",
    });
    return { success: true, location: "otp" };
  }

  /** Paso 3: validar OTP con Verify */
  async validateCallback(
    data: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const { phone, otp } = data.query || {};
    if (!phone || !otp) {
      return { success: false, error: "Phone and OTP are required" };
    }
    // verifica el código contra Twilio Verify
    const check = await this.client.verify.v2
      .services(this.serviceSid)
      .verificationChecks.create({ to: phone, code: otp });
    if (!check.valid) {
      return { success: false, error: "Invalid or expired OTP" };
    }
    // todo ok, limpia (opcional) y devuelve éxito
    const updatedUser = await authIdentityService.update(phone, {
      provider_metadata: {}, // ya no guardamos OTP
    });
    return { success: true, authIdentity: updatedUser };
  }
}

export default PhoneAuthService;
