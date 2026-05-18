const nodemailer = require("nodemailer");

const crearTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });
};

exports.enviarConfirmacionEmail = async (email, nombre, pedido, metodoPago) => {
    try {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
            console.warn("⚠️  GMAIL_USER o GMAIL_PASS no están configurados; se omite el envío de email.");
            return;
        }

        const transporter = crearTransporter();

        const metodoTexto =
            metodoPago === "tarjeta"       ? "Tarjeta de crédito/débito" :
            metodoPago === "transferencia" ? "Transferencia bancaria"     :
                                             "No especificado";

        const productosHTML = pedido.productos.map(p => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #f3e0e8;">
                    ${p.nombre}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #f3e0e8; text-align: center;">
                    ${p.cantidad}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #f3e0e8; text-align: right;">
                    $${(p.precio * p.cantidad).toLocaleString()}
                </td>
            </tr>
        `).join("");

        const html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;
             background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #f0d0e0;">

            <div style="background-color: #c2185b; padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Gorditas con Estilo</h1>
                <p style="color: #f8bbd9; margin: 8px 0 0;">¡Tu pedido fue confirmado! ✅</p>
            </div>

            <div style="padding: 32px;">
                <p style="font-size: 16px; color: #333;">
                    Hola <strong>${nombre}</strong>,
                </p>
                <p style="color: #555; line-height: 1.6;">
                    Gracias por tu compra. Aquí tienes el resumen de tu pedido:
                </p>

                <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                    <thead>
                        <tr style="background: #f8f0f5;">
                            <th style="padding: 10px; text-align: left;
                                color: #c2185b; font-weight: 500;">
                                Producto
                            </th>
                            <th style="padding: 10px; text-align: center;
                                color: #c2185b; font-weight: 500;">
                                Cantidad
                            </th>
                            <th style="padding: 10px; text-align: right;
                                color: #c2185b; font-weight: 500;">
                                Subtotal
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productosHTML}
                    </tbody>
                </table>

                <div style="background: #f8f0f5; border-radius: 8px;
                     padding: 16px; margin-top: 8px;">
                    <p style="margin: 0 0 8px; color: #555; font-size: 14px;">
                        <strong>Método de pago:</strong> ${metodoTexto}
                    </p>
                    <p style="margin: 0; font-size: 20px; color: #c2185b; font-weight: 600;">
                        Total pagado: $${pedido.total.toLocaleString()}
                    </p>
                </div>

                <p style="color: #555; line-height: 1.6; margin-top: 24px;">
                    Pronto nos pondremos en contacto contigo para coordinar la entrega. 🛍️
                </p>
            </div>

            <div style="background: #f8f0f5; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #888;">
                    Gorditas con Estilo — Moda para todas las tallas
                </p>
            </div>
        </div>`;

        await transporter.sendMail({
            from: `"Gorditas con Estilo" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "✅ Confirmación de tu pedido — Gorditas con Estilo",
            html
        });

        console.log("✅ Email enviado correctamente a:", email);

    } catch (error) {
        console.error("❌ Error al enviar email:", error.message);
    }
};